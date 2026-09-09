# Segurança – AutoServiceManager

Este documento registra a postura de segurança do MVP, controles aplicados e o
resultado da análise de vulnerabilidades de dependências executada com
`yarn audit` e da análise estática com ESLint/TypeScript.

**Fase 3:** threat model e matriz ASVS em [`threat-model.md`](./threat-model.md) e [`controls-matrix.md`](./controls-matrix.md). Gate `gate-security-review`: **PASS** (revalidado 2026-09-02 — hardening entrega/deploy AWS).

## Gate de entrega e deploy AWS

| Etapa | Controle | Artefato |
|-------|----------|----------|
| PR / push | Audit deps + scan secrets | `scripts/security-gate.sh`, `.github/workflows/security-gate.yml` |
| CD app/lambda/infra | `security-gate` obrigatório antes de OIDC deploy | Workflows `ci-cd.yml` por remote |
| Pré-deploy EKS | Secrets via K8s/Secrets Manager; sem seed demo | [runbook-deploy-eks.md](../runbook-deploy-eks.md) |
| Pós-deploy | Smoke via API Gateway (Swagger off, health) | `scripts/security-smoke.sh` |
| Production runtime | CORS allowlist, Swagger off, gateway headers, Joi blocklist | `src/main.ts`, `env.validation.ts`, `k8s/configmap.yaml` |

### Checklist — não commitar credenciais

- [ ] `.env` permanece gitignored (só `.env.example` versionado)
- [ ] Nunca commitar `k8s/secret.yaml` real, `*.tfstate`, `*.tfvars` com valores, PEMs, `*.pkg`
- [ ] CI falha se `.env` tracked ou padrões AKIA/PEM no diff
- [ ] Demo passwords (`Senha@1234`, compose secrets) **somente** local/docker

```bash
bash scripts/security-gate.sh
bash scripts/security-smoke.sh "https://<APIGW_URL>"
```

## Controles aplicados na aplicação

| Categoria | Controle | Local |
|-----------|----------|-------|
| Autenticação | JWT (HS256) com expiração configurável e secret validado por Joi (`JWT_SECRET` ≥ 16 chars). | `src/infrastructure/auth/jwt.strategy.ts`, `src/infrastructure/config/env.validation.ts` |
| Autorização | RBAC por role (`ADMIN`, `GERENTE`, `MECANICO`, `ATENDENTE`) via `RolesGuard` + decorator `@Roles`. | `src/infrastructure/auth/roles.guard.ts` |
| Senhas | Hash bcrypt com 10 rounds; senhas nunca expostas em DTOs de saída. | `src/application/autenticacao/use-cases/*` |
| Headers HTTP | `helmet()` aplicado globalmente. | `src/main.ts` |
| Rate limiting | `@nestjs/throttler` global: **100**/60s; `POST /ordens-servico` **10**/60s. | `src/app.module.ts`, `ordem-servico.controller.ts` |
| CORS / Swagger | Production: `CORS_ORIGIN` allowlist obrigatório; Swagger off unless `SWAGGER_ENABLED=true`. | `src/main.ts`, `env.validation.ts` |
| Gateway trust (T1) | `REQUIRE_GATEWAY_HEADERS=true` exige `x-gateway-verified: 1` (APIGW). | `cliente-auth.guard.ts`, `infra-k8s/apigw.tf` |
| Webhook | `timingSafeEqual` para `X-Webhook-Secret`. | `webhook-secret.guard.ts` |
| Log redaction | Mascara password/token/authorization/cpf em logs JSON. | `log-redact.ts`, `json-logger.service.ts` |
| Secrets production | Joi rejeita valores demo/compose em `JWT_SECRET`, `WEBHOOK_SECRET`, `DATABASE_URL`. | `forbidden-secrets.ts`, `env.validation.ts` |
| CI security gate | Audit + secret scan antes de CD AWS. | `scripts/security-gate.sh`, workflows CI |
| Validação de input | `class-validator` + `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`); Value Objects `CpfCnpj` e `Placa` aplicam regras de domínio. | `src/main.ts`, `src/shared/utils/*` |
| Validação de ENV | Schema Joi obrigatório em bootstrap. Falha rápido sem variáveis seguras. | `src/infrastructure/config/env.validation.ts` |
| Segredos | Variáveis sensíveis (`JWT_SECRET`, `DATABASE_URL`, `OS_NOTIFICATIONS_TOPIC_ARN`) via `ConfigService`; `.env` em `.gitignore`. | `src/main.ts`, `.gitignore` |
| Soft-delete | Cliente, Veículo, ServiçoCatálogo e PeçaEstoque marcam `ativo=false` ao invés de remoção física. | `prisma/schema.prisma`, `src/domain/**` |
| Auditoria | Transições de OS em MySQL (`OrdemServicoStatusHistorico`) + logs JSON CloudWatch (`PrismaOsAuditRepository`, ADR-010). | `src/infrastructure/database/mysql/repositories/prisma-os-audit.repository.ts` |
| Testes | Threshold Jest em `package.json` (`statements/lines >= 80%`, `branches/functions >= 70%`); suíte atual cobre integração HTTP e domínio (ver `yarn test` / `yarn test:cov`). | `package.json`, `test/integration/` |
| Container | Runtime **não-root** (uid/gid **10001**); K8s `runAsNonRoot` + `readOnlyRootFilesystem` + `capabilities.drop: [ALL]`; `emptyDir` em `/tmp`; migrations só no Job com SA `autoservice-migrate` (sem token de API). | `Dockerfile`, `k8s/api-deployment.yaml`, `k8s/job-migrate.yaml`, `k8s/serviceaccount-migrate.yaml` |

## Análise de vulnerabilidades (`yarn audit --level moderate`)

Resultado completo armazenado em `docs/security/yarn-audit.txt` (texto) e
`docs/security/yarn-audit.jsonl` (JSON). Resumo indexado em
`docs/security/audit-summary.txt`. Auditoria **somente produção**:
`docs/security/yarn-audit-prod-only.txt`. Detalhamento agregado legado:
`docs/security/audit-detail.txt` (consultar `yarn-audit.txt` para o estado mais recente).

Resumo após mitigações aplicadas (executado com `node 22`, `yarn 1.22`):

| Severidade | Antes | Depois | Notas |
|-----------|-------|--------|-------|
| Critical  | 1     | 1      | `handlebars` (transitivo de `ts-jest`, dev-only) |
| High      | 36    | 32     | Reduzido removendo cadeias de `path-to-regexp`/`lodash` em produção |
| Moderate  | 62    | 55     | Idem |
| Low       | 1     | 1      | – |

**Re-verificação em 02/09/2026** (`security-gate`): `yarn audit --groups dependencies --level moderate` → **0 moderate+**; **1 Low** (`body-parser`). `qs` bump `^6.16.0`. Lambda `npm audit --production` → **0**. Evidência: `yarn-audit-prod-only.txt`.

> O total de "vulnerabilities found" reportado pelo `yarn audit` conta a mesma
> advisory uma vez por caminho de dependência (path). A coluna acima reflete
> esses números brutos; o número de advisories *únicos* caiu de **23** para **20**.

### Mitigações já aplicadas (produção)

| Pacote | Versão alvo | Como mitigamos |
|--------|-------------|----------------|
| `@nestjs/core` (CWE-injection, GHSA) | `>=11.1.18` | Bump para `^11.1.19` em `package.json`. |
| `@nestjs/common` | `>=11.1.18` | Bump para `^11.1.19`. Atualiza `file-type` para `>=21.3.4` (mitigando ASF infinite loop e ZIP bomb). |
| `@nestjs/platform-express` | `>=11.1.19` | Bump para `^11.1.19` (atualiza `path-to-regexp` direto para `8.4.2`). |
| `@nestjs/config` | `>=4.0.4` | Bump para `^4.0.4` (atualiza `lodash` para `4.18.x`). |
| `js-yaml` (transitivo `@nestjs/swagger`) | `>=4.3.1` | `resolutions["js-yaml"]: ^4.3.1` (CVE-2026-59870). |
| `path-to-regexp` (transitivo de `@nestjs/swagger`/`express > router`) | `>=8.4.0` | `resolutions["path-to-regexp"]: ^8.4.2` em `package.json`. Verificado com `yarn list` que apenas `8.4.2` está instalado. |
| `lodash` (transitivo de `@nestjs/swagger`/`@nestjs/cli > node-emoji`) | `>=4.18.0` | `resolutions["lodash"]: ^4.18.1` em `package.json`. Verificado com `yarn list` que apenas `4.18.1` está instalado. |

> Observação: o `yarn audit` (yarn 1.x) avalia advisories pelo manifesto da
> dependência intermediária e não pelo arquivo `yarn.lock` resolvido. Por isso
> as cadeias de `path-to-regexp` (via `@nestjs/swagger`) e `lodash` continuam
> sendo listadas mesmo após o `resolutions`. A versão efetivamente instalada
> está dentro da faixa de patch (`8.4.2` e `4.18.1` respectivamente),
> conforme `docs/security/yarn-list-after.txt`.

### Vulnerabilidades pendentes (somente dev-dependencies)

| Pacote | Cadeia | Severidade | Status / Justificativa |
|--------|--------|-----------|------------------------|
| `handlebars` | `ts-jest > handlebars` | Critical/High/Moderate | ts-jest 29 ainda traz handlebars vulnerável; aguardar release do ts-jest. Sem impacto runtime (test-only). Monitorar via Dependabot/`yarn audit`. |
| `picomatch` (<2.3.2 e <4.0.4) | `jest`/`ts-loader`/`@nestjs/cli` | High/Moderate | Apenas em build/test. Mitigado por execução em ambiente isolado de CI. |
| `ajv` | `@nestjs/cli > @angular-devkit/core > ajv` | Moderate | CLI dev-only. Não usado em runtime. |
| `flatted` | `eslint > file-entry-cache > flat-cache > flatted` | High | Dev-only (linting). |
| `brace-expansion` | `eslint`, `jest`, `typescript-eslint`, `@nestjs/cli` | Moderate | Dev/build-only. |
| `lodash` (`@nestjs/cli > node-emoji`) | dev-only | Moderate/High | Apenas o CLI; runtime do app não importa `node-emoji`. |

Plano: dependências dev são monitoradas em CI; quando uma versão patched
sair (especialmente `ts-jest`/`@nestjs/cli`) o time atualiza no próximo
release menor.

## Análise estática

Saída completa em `docs/security/eslint-report.txt`.

Resultado: **0 erros e 0 warnings** após esta entrega.

Itens corrigidos / configurados:

- `src/infrastructure/notifications/log-orcamento-notifier.ts`: removido `async` em método sem `await`.
- `src/application/autenticacao/use-cases/{criar,atualizar,obter,listar}-usuario.use-case.ts`: padrão `_senhaHash` para descartar a senha do retorno.
- `eslint.config.mjs`: override para arquivos `*.spec.ts` desliga regras
  `no-unsafe-*`/`unbound-method` (intrínsecas a mocks Jest com tipos
  `unknown`); pattern `^_` adicionado a `no-unused-vars` para variáveis
  intencionalmente descartadas.

Plano de melhoria contínua: introduzir tipos fortes nos mocks de testes
quando os módulos forem revisados, removendo a necessidade do override.

## Como reproduzir

```bash
yarn install
bash scripts/security-gate.sh
yarn audit --groups dependencies --level moderate   # só runtime (esperado: 0 moderate+)
yarn audit --level moderate                         # árvore completa (inclui dev)
yarn lint > docs/security/eslint-report.txt 2>&1
yarn test:cov                                       # testes + thresholds Jest
```

