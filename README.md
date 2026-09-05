# AutoServiceManager

Backend para gestão de oficina mecânica — **Fase 3**: NestJS hexagonal em **EKS**, **API Gateway** + Lambda `authCpf` (JWT **RS256**), **RDS MySQL** (Prisma), **CloudWatch/X-Ray**, sem MongoDB no caminho crítico ([ADR-010](docs/architecture/adr-010-discontinue-mongodb-audit.md)).

Monorepo até a cisão dos quatro repositórios (+ pacote compartilhado):

| Unidade | Pasta | Destino pós-cisão |
|---------|-------|-------------------|
| App NestJS + manifests K8s + Dockerfile | raiz (`src/`, `k8s/`, `prisma/`) | `autoservicemanager-app` |
| Lambda auth CPF | [`auth-lambda/`](auth-lambda/) | `autoservicemanager-auth-lambda` |
| Terraform VPC + RDS | [`infra-db/`](infra-db/) | `autoservicemanager-infra-db` |
| Terraform EKS / APIGW / Lambda / obs | [`infra-k8s/`](infra-k8s/) | `autoservicemanager-infra-k8s` |
| Validações CPF/CNPJ/placa | [`packages/domain-shared/`](packages/domain-shared/) | GitHub Packages (`@autoservicemanager/domain-shared`) |

| Doc | Link |
|-----|------|
| Release notes | [docs/release-notes.md](docs/release-notes.md) |
| Solution design Fase 3 | [docs/architecture/solution-design-fase3.md](docs/architecture/solution-design-fase3.md) |
| Diagramas / ER / riscos | [diagrams](docs/architecture/diagrams-fase3.md) · [ER](docs/architecture/er-diagram.md) · [riscos](docs/architecture/risk-map-fase3.md) |
| Runbook | [docs/runbook.md](docs/runbook.md) |
| Contrato API | [docs/backend/api-contract.md](docs/backend/api-contract.md) |
| Observabilidade | [docs/observability/](docs/observability/) |
| Segurança | [docs/security/SECURITY.md](docs/security/SECURITY.md) |

## Estrutura do repositório

```
autoServiceManager/
├── src/                      # App NestJS (hexagonal)
│   ├── domain/               # Entidades, VOs, ports, eventos
│   ├── application/          # Casos de uso + DTOs
│   ├── infrastructure/       # Prisma, auth, config, notificações, obs
│   ├── interfaces/http/      # Controllers Nest
│   └── shared/               # Erros, DTO comuns, reexports domain-shared
├── packages/domain-shared/   # CPF/CNPJ/placa (Yarn workspace)
├── auth-lambda/              # Lambda authCpf (RS256)
├── infra-db/                 # Terraform dados (VPC + RDS)
├── infra-k8s/                # Terraform compute/edge (EKS, APIGW, JWKS, IRSA)
├── k8s/                      # Manifestos app (Deployment, HPA, migrate, X-Ray)
│   └── local/                # Demo kind (Fase 2 / local)
├── prisma/                   # schema + migrations + seed
├── scripts/                  # kind-setup, smoke-test, load-test
├── docker-compose.yml        # Stack local API + MySQL (+ Mongo legado opcional)
├── docker-compose.db.yml     # Só DB no host (kind)
├── infra/terraform/          # Terraform legado Fase 2 (dev/local)
└── docs/                     # Arquitetura, backend, infra, obs, QA, security
```

Bounded contexts em `domain/` / `application/` / `interfaces/http/modules/`: **atendimento**, **autenticacao**, **cadastro**, **catalogo-servicos**, **estoque**.

## Pré-requisitos

- Node.js (recomendado **Node 22**, mesma major do `Dockerfile`)
- Yarn
- MySQL acessível (local ou Docker) para `DATABASE_URL`

## Persistência (Fase 3)

**MySQL (Prisma) — única fonte da verdade transacional:** estado da OS, cliente-veículo, estoque, admin (ACID, FKs, `Decimal`). Migrações em `prisma/migrations/`; em EKS via Job `autoservice-migrate`. Modelo: [er-diagram.md](docs/architecture/er-diagram.md).

**Auditoria:** logs JSON + CloudWatch (não Mongo). Código legado `OsMongoAuditPort` / `MONGODB_URI` permanece como **noop** quando a URI está vazia ([ADR-010](docs/architecture/adr-010-discontinue-mongodb-audit.md)). Documento histórico MySQL+Mongo: [`docs/arquitetura-mysql-mongo-validacao.md`](docs/arquitetura-mysql-mongo-validacao.md).

## Configuração

```bash
yarn install
cp .env.example .env
yarn db:generate
yarn db:migrate
```

Variáveis principais (validação em `src/infrastructure/config/env.validation.ts`):

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string MySQL (Prisma) |
| `JWT_SECRET` | Sim | Segredo JWT **admin** HS256 (mín. 16 caracteres) |
| `PORT` | Não | Porta HTTP (padrão: 3000) |
| `NODE_ENV` | Não | `development` \| `production` \| `test` |
| `LOG_FORMAT` | Não | `json` em produção / EKS |
| `AWS_XRAY_ENABLED` | Não | `true` no cluster com DaemonSet |
| `SHADOW_DATABASE_URL` | Não | Shadow DB do `prisma migrate dev` |
| `WEBHOOK_SECRET` | Não | Webhook de status (mín. 16) |
| `EMAIL_ENABLED` | Não | `true` para SMTP (Mailtrap em demo) |
| `SMTP_*` / `EMAIL_FROM` | Não | Credenciais SMTP |
| `MONGODB_URI` | Não | Legado; vazio = audit noop (Fase 3) |
| `CORS_ORIGIN` | Não | Lista separada por vírgula (omitir = `*`; lido em `main.ts`) |

Scripts Prisma:

| Script | Descrição |
|--------|-----------|
| `yarn db:generate` | Gera `@prisma/client` |
| `yarn db:migrate` | `prisma migrate dev` |
| `yarn db:studio` | Prisma Studio |
| `yarn db:seed` | Dados de demonstração |

Em produção/CI: `npx prisma migrate deploy`.

### Seed

```bash
yarn db:seed
```

Cria 4 usuários administrativos (um por role), 6 clientes, 11 veículos, 12 serviços, 12 peças e **7 ordens de serviço** cobrindo todos os `StatusOs`. E-mails admin em `@autoservice.local`; senha demo **`Senha@1234`** (`prisma/seed.ts`). Linhas `ADMIN_SEED_*` em `.env.example` são apenas exemplo — o seed atual **não** as usa. **Altere senhas em produção.**

## Autenticação e autorização

### Admin (Nest / HS256)

- `POST /auth/login` — `{ "email", "password" }` (público)
- Resposta: `access_token` (JWT HS256), `expires_in`, `user`
- Rotas `/admin/*`: `Authorization: Bearer <access_token>` + RBAC (`ADMIN`, `GERENTE`, `MECANICO`, `ATENDENTE`)

### Cliente (API Gateway / RS256) — Fase 3

- `POST /auth/cpf` no **API Gateway** → Lambda ([auth-lambda/README.md](auth-lambda/README.md))
- Authorizer valida JWT RS256 (JWKS) e injeta headers `x-cpf` / `x-scope` no Nest
- Rotas de cliente no app: `GET /ordens-servico/:id/status` e `POST /ordens-servico/:id/aprovacoes` exigem role `CLIENTE` via `ClienteAuthGuard` (ADR-007)
- O Nest **não** revalida a assinatura RS256 — confia nos headers do gateway

### Outros

- Webhook: `X-Webhook-Secret` (não usa JWT)
- Senhas admin: **bcrypt** (10 rounds)
- Borda HTTP: **Helmet**, **CORS**, **throttler** (100 req / 60s)
- Health/probes: `GET /` (público, sem throttle)

## API administrativa (JWT obrigatório)

Rotas JSON (`Content-Type: application/json`). Validação com `class-validator` + `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`). Sem token válido → **401**. Role insuficiente → **403**.

### Usuários

| Método | Rota | Roles |
|--------|------|-------|
| `POST` | `/admin/usuarios` | ADMIN |
| `GET` | `/admin/usuarios` | ADMIN, GERENTE |
| `GET` | `/admin/usuarios/:id` | ADMIN, GERENTE |
| `PATCH` | `/admin/usuarios/:id` | ADMIN |
| `PATCH` | `/admin/usuarios/:id/senha` | Próprio usuário ou ADMIN |

### Clientes

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| `POST` | `/admin/clientes` | ADMIN, GERENTE, ATENDENTE | Cria cliente |
| `GET` | `/admin/clientes` | ADMIN, GERENTE, ATENDENTE | Lista (`?incluirInativos=true` opcional) |
| `GET` | `/admin/clientes/:id` | ADMIN, GERENTE, ATENDENTE | Detalhe |
| `PATCH` | `/admin/clientes/:id` | ADMIN, GERENTE, ATENDENTE | Atualiza (CPF/CNPJ imutável) |
| `DELETE` | `/admin/clientes/:id` | ADMIN, GERENTE | Soft-delete; falha se OS aberta |

### Veículos

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| `POST` | `/admin/veiculos` | ADMIN, GERENTE, ATENDENTE | Cria veículo |
| `GET` | `/admin/veiculos` | ADMIN, GERENTE, ATENDENTE | Lista (`?clienteId`, `?incluirInativos`) |
| `GET` | `/admin/veiculos/:id` | ADMIN, GERENTE, ATENDENTE | Detalhe |
| `PATCH` | `/admin/veiculos/:id` | ADMIN, GERENTE, ATENDENTE | Atualiza marca/modelo/ano |
| `DELETE` | `/admin/veiculos/:id` | ADMIN, GERENTE | Soft-delete; falha se OS aberta |

### Catálogo de Serviços

| Método | Rota | Roles |
|--------|------|-------|
| `POST` / `GET` / `GET :id` / `PATCH` / `DELETE` | `/admin/servicos` | ADMIN, GERENTE |

### Estoque de Peças

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| CRUD soft-delete | `/admin/pecas` | ADMIN, GERENTE | — |
| `POST` | `/admin/pecas/:id/movimentacoes` | ADMIN, GERENTE | `entrada` \| `saida` |

### Ordens de Serviço (Admin)

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| `GET` | `/admin/ordens-servico` | Staff | Lista priorizada (exclui FINALIZADA/ENTREGUE) |
| `GET` | `/admin/ordens-servico/:id` | Staff | Detalhe com itens |
| `POST` | `/admin/ordens-servico/:id/diagnostico` | ADMIN, GERENTE, MECANICO | → `EM_DIAGNOSTICO` |
| `POST` | `/admin/ordens-servico/:id/orcamento` | ADMIN, GERENTE, MECANICO | → `AGUARDANDO_APROVACAO` + notificação |
| `POST` | `/admin/ordens-servico/:id/finalizacao` | ADMIN, GERENTE, MECANICO | → `FINALIZADA` + baixa peças |
| `POST` | `/admin/ordens-servico/:id/entrega` | ADMIN, GERENTE, ATENDENTE | → `ENTREGUE` |
| `GET` | `/admin/ordens-servico/:id/historico` | Staff | Legado Mongo; array vazio se `MONGODB_URI` vazio (audit em CloudWatch) |
| `GET` | `/admin/ordens-servico/metricas/tempo-medio` | ADMIN, GERENTE | Tempo médio por tipo de serviço |

Regras: **CPF/CNPJ** com DV; **placa** antiga ou Mercosul; **código interno** único; estoque sem saldo negativo (saída excessiva → 422). Validações compartilhadas via `@autoservicemanager/domain-shared`.

## API de Ordem de Serviço (cliente / público)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/ordens-servico` | Público | Cria OS → `RECEBIDA` |
| `GET` | `/ordens-servico/:id/status` | Cliente (`x-cpf`) | Consulta status; CPF deve bater com o cliente da OS |
| `POST` | `/ordens-servico/:id/aprovacoes` | Cliente (`x-cpf`) | Body `{ "aprovado": true \| false }` → `EM_EXECUCAO` ou `REJEITADA` |
| `POST` | `/webhooks/os/:id/status` | `X-Webhook-Secret` | Integração máquina |

Detalhes e códigos de erro: [docs/backend/api-contract.md](docs/backend/api-contract.md).

## Fluxo da Ordem de Serviço

```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE
                                    ↓
                                REJEITADA
```

1. **Criação** (público): cliente/veículo/itens → `RECEBIDA`
2. **Diagnóstico** (admin) → `EM_DIAGNOSTICO`
3. **Orçamento** (admin) → `AGUARDANDO_APROVACAO` + notificação
4. **Aprovação** (cliente autenticado): reserva peças → `EM_EXECUCAO`, ou → `REJEITADA`
5. **Finalização** (admin) → `FINALIZADA`
6. **Entrega** (admin) → `ENTREGUE`

Eventos de domínio em `src/domain/atendimento/events/`.

## Executar

```bash
# desenvolvimento
yarn start:dev

# produção (após build)
yarn build          # domain-shared + nest build
yarn start:prod
```

## Scripts úteis

| Script | Descrição |
|--------|-----------|
| `yarn lint` | ESLint em `src`, `test`, `packages` |
| `yarn test` | Unitários + integração HTTP + testes `domain-shared` |
| `yarn test:e2e` | E2E (`PrismaService` mockado) |
| `yarn test:cov` | Cobertura (statements/lines ≥ 80%, branches/functions ≥ 70%) |
| `yarn arch:check` | dependency-cruiser (boundaries hexagonais) |
| `yarn domain-shared:build` / `:test` | Pacote compartilhado |
| `yarn auth-lambda:build` / `:test` | Lambda no monorepo |
| `yarn db:seed` | Seed de demonstração |

## Arquitetura hexagonal

| Camada | Pasta |
|--------|--------|
| Driving adapters (HTTP) | `src/interfaces/http/` |
| Application | `src/application/` |
| Domain | `src/domain/` |
| Driven adapters | `src/infrastructure/` |

Validação de boundaries: `yarn arch:check` ([ADR-003](docs/architecture/adr-003-hexagonal-adaptation.md)).

## Documentação da API (Swagger)

- **Swagger UI**: `GET /api-docs` (ex.: http://localhost:3000/api-docs)
- **OpenAPI JSON**: `GET /api-docs-json`
- **Postman**: [`docs/postman/autoservicemanager.postman_collection.json`](docs/postman/autoservicemanager.postman_collection.json)
- Rotas `/admin/*` usam segurança Bearer (`JWT-auth`)

## Docker

- **`Dockerfile`**: multi-stage (Node 22); runtime uid **10001**; migrate **não** roda no entrypoint
- **`docker-compose.yml`**: MySQL 8, Mongo legado opcional, Job `migrate`, API na porta **3000**

```bash
docker compose up --build
```

Seed no host (MySQL em `3306`):

```bash
DATABASE_URL="mysql://app:appsecret@127.0.0.1:3306/autoservicemanager" \
  JWT_SECRET="docker-compose-dev-jwt-secret-min-16-chars" yarn db:seed
```

Altere `JWT_SECRET` e credenciais em qualquer ambiente não-local.

## Deploy

### Fase 3 (canônico)

Ordem: bootstrap state S3+DynamoDB → [`infra-db`](infra-db/) → [`infra-k8s`](infra-k8s/) → bind Target Group → apply manifests `k8s/` (ou CI). Ver [docs/runbook.md](docs/runbook.md).

**Kubernetes (EKS):** versão **1.34** (suporte padrão AWS; default em [`infra-k8s/variables.tf`](infra-k8s/variables.tf)). Upgrades do control plane são **+1 minor por vez**.

CI/CD (OIDC, sem AKIA):

| Workflow | Escopo |
|----------|--------|
| [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) | App: lint, arch, test, build, ECR, migrate, deploy EKS |
| [`auth-lambda-ci-cd.yml`](.github/workflows/auth-lambda-ci-cd.yml) | Bundle Lambda |
| [`infra-db-ci-cd.yml`](.github/workflows/infra-db-ci-cd.yml) | Terraform db |
| [`infra-k8s-ci-cd.yml`](.github/workflows/infra-k8s-ci-cd.yml) | Terraform k8s |
| [`publish-domain-shared.yml`](.github/workflows/publish-domain-shared.yml) | Tag `domain-shared-v*` → GitHub Packages |

Governança (`master` protegida: PR a partir de `develop` + check `ci`; `develop` recebe push direto; environments homolog/production; colaborador `soat-architecture`): [docs/infrastructure/branch-protection.md](docs/infrastructure/branch-protection.md).

### Local kind (demo)

```bash
./scripts/kind-setup.sh
# ou: cd infra/terraform/local && terraform apply && ./scripts/kind-setup.sh
```

- DB host: [`docker-compose.db.yml`](docker-compose.db.yml)
- Manifestos: [`k8s/local/`](k8s/local/) — API http://localhost:30080
- Runbook: [`docs/runbook-deploy-local-k8s.md`](docs/runbook-deploy-local-k8s.md)
- Smoke: `yarn db:seed && ./scripts/smoke-test-apis.sh`
- HPA demo: `./scripts/load-test.sh`

### Terraform legado (Fase 2)

[`infra/terraform/`](infra/terraform/) e [`docs/runbook-deploy-eks.md`](docs/runbook-deploy-eks.md) cobrem o path monolítico anterior. Preferir `infra-db` + `infra-k8s` para Fase 3.

## Documentação complementar

| Área | Links |
|------|-------|
| ADRs Fase 3 | [004](docs/architecture/adr-004-api-gateway-vpc-link.md)–[010](docs/architecture/adr-010-discontinue-mongodb-audit.md) |
| RFCs | [001 AWS](docs/architecture/rfc-001-cloud-aws.md) · [002 RDS](docs/architecture/rfc-002-mysql-rds.md) · [003 Auth](docs/architecture/rfc-003-auth-lambda-rs256.md) |
| Backend | [repo-app](docs/backend/repo-app.md) · [auth-lambda](docs/backend/auth-lambda.md) · [domain-shared](docs/backend/domain-shared-package.md) |
| Infra docs | [repo-infra-db](docs/infrastructure/repo-infra-db.md) · [repo-infra-k8s](docs/infrastructure/repo-infra-k8s.md) · [ci-cd](docs/infrastructure/ci-cd.md) |
| Fase 2 (baseline) | [solution-design.md](docs/architecture/solution-design.md) · [fase2 diagram](docs/architecture/fase2-architecture-diagram.md) · [ADR-002 e-mail](docs/architecture/adr-002-fase2-aws-email.md) |
| Domínio / status | [status-os](docs/status-os-validacoes-mapeamento.md) · [notificações](docs/notificacoes-fluxos-analise.md) |
| QA | [validation](docs/qa/validation-report.md) · [regression](docs/qa/regression-report.md) |
| Spec-skills | [`AGENTS.md`](AGENTS.md) · [`spec-skills-lib/`](spec-skills-lib/) |
