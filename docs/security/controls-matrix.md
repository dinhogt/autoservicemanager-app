# Controls Matrix — AutoServiceManager (Fase 3)

| Campo | Valor |
|-------|-------|
| Role | `security` |
| ASVS | L1 (MVP) — `implementation_level: mvp` |
| Playbook | `spec-skills-lib/rules/security-playbook.yaml` |
| Data | 2026-09-02 |
| Threat model | [threat-model.md](./threat-model.md) |

## ASVS controls (escopo tocado)

| Controle | Requisito | Estado | Evidência / implementação |
|----------|-----------|--------|---------------------------|
| V1.2 | Security requirements documentados | **Met** | Este doc + [SECURITY.md](./SECURITY.md) + ADRs 007–010 |
| V1.4 / V1.1 | Threat model para mudanças maiores | **Met** | [threat-model.md](./threat-model.md) |
| V2.1 | Validação de input nas boundaries | **Met** (app); **Planejado** (Lambda) | `ValidationPipe` + VOs CPF/placa; Lambda deve usar `domain-shared` |
| V2.5 | Queries parametrizadas / ORM | **Met** | Prisma; Lambda: `mysql2` prepared statements (todo `repo-lambda`) |
| V3.1 / V2 (auth) | Auth/session basics | **Met** (desenho) | Admin HS256; cliente RS256 + JWT Authorizer (ADR-007) |
| V4.1 / V4.2 | Access control / deny-by-default | **Met** (admin); **Planejado** (CLIENTE) | `RolesGuard`; role `CLIENTE` no gateway (`repo-app`) |
| V6.1 | Sem secrets no source control | **Met** | `.gitignore` `.env`; Secrets Manager / OIDC; senha RDS via `random_password`; PR infra-db sem AWS |
| V7.1 | Lockfile + audit local | **Met** | `yarn.lock`; audit em [yarn-audit-prod-only.txt](./yarn-audit-prod-only.txt) |
| V8.1 | Proteção em trânsito/repouso | **Parcial** | RDS encrypted + SG sem CIDR; state S3 SSE + bucket policy; TLS APIGW/NLB em `repo-infra-k8s` |
| V10.1 | Logging sem secrets/PII completa | **Met** | `JsonLogger` + `log-redact.ts` (password/token/cpf); ADR-010 |
| V14.1 | Security headers / transport | **Met** (app) | `helmet()`; HTTPS no edge (APIGW); CORS allowlist em production |
| V6.1 (runtime) | Secrets demo bloqueados em production | **Met** | Joi + `forbidden-secrets.ts`; ConfigMap K8s sem valores reais |
| CI | Gate antes de deploy AWS | **Met** | `security-gate.yml` + `scripts/security-gate.sh` em todos os workflows CD |

## Controles por componente Fase 3

| Componente | Controles obrigatórios antes de produção demo |
|------------|-----------------------------------------------|
| API Gateway | JWT Authorizer; HTTPS; throttle `/auth/cpf`; routes admin/cliente separadas |
| Lambda `authCpf` | Secrets Manager; sem log de token; rate via APIGW; domain-shared |
| EKS App | Não-root; readOnlyRootFS; migrate Job; confiar `x-cpf` só via VPC Link; admin JWT local |
| RDS | Private subnet; SG sem ingress CIDR (SG→SG no k8s); secret rotacionável |
| CI (4 repos) | OIDC → IAM; sem AKIA; infra-db: PR sem assume-role; plan→apply tfplan; state keys por env |
| JWKS | Público read-only; dois `kid` na rotação |

## Dependency audit checklist

| Alvo | Comando | Resultado 2026-08-08 |
|------|---------|----------------------|
| Monólito (este repo) — prod | `yarn audit --groups dependencies --level moderate` | **0 moderate+**; 1 Low (`body-parser`) — ver triagem |
| Monólito — árvore completa | `yarn audit --level moderate` | Dev-heavy (jest/cli); aceito residual acadêmico |
| `@dinhogt/domain-shared` | Coberto pelo workspace atual + Packages | Sem deps vulneráveis próprias |
| `autoservicemanager-auth-lambda` | `yarn audit --groups dependencies --level moderate` (após `yarn install --frozen-lockfile`) | **Met** — 0 moderate+ (2026-09-02) |
| `autoservicemanager-infra-db` / `infra-k8s` | Sem npm runtime; revisar providers TF + sem secrets em `.tf` | **infra-db Met** ([hardening-infra-db.md](./hardening-infra-db.md)); `infra-k8s` pausado |

### Triagem

| ID | Achado | Severidade | Decisão |
|----|--------|------------|---------|
| ~~AUDIT-001~~ | `js-yaml` CVE-2026-59870 via `@nestjs/swagger` | High | **Mitigado** — `resolutions["js-yaml"]=^4.3.1` (lock → 4.3.1) |
| AUDIT-002 | `body-parser` CVE-2026-12590 (limit inválido desativa size check) | Low | **Aceito residual** — Nest/Express usam default `100kb`; não passamos `limit` dinâmico inválido. Monitorar bump express/`@nestjs/platform-express`. |
| AUDIT-DEV | handlebars/picomatch/etc via jest/cli | Critical–High (dev) | Aceito — não no runtime da imagem de produção |

## Release checklist (security-playbook)

- [x] Threat model atualizado para boundaries alteradas
- [x] Dependency audit executado e críticos triados (High prod = 0)
- [x] Sem secrets no diff
- [x] Job `security-gate` integrado aos workflows de CD
- [x] Smoke pós-deploy documentado (`scripts/security-smoke.sh`)
- [x] Critérios `gate-security-review` satisfeitos

## Handoff

- **next_role:** `infrastructure` — **somente após** gate [hardening-infra-db.md](./hardening-infra-db.md); retomar `repo-infra-k8s`
- **goal:** SG→SG no RDS + APIGW/EKS/Lambda com remote_state `db/<env>/`
- **open_risks (máx. 3):**
  1. Headers `x-cpf` confiáveis só com SG/VPC Link corretos (T1)
  2. AUDIT-002 Low `body-parser` até bump upstream
  3. Trust OIDC IAM na conta AWS ainda manual (T5 ops)

---

# Extensão de controles — Fase 4

Os controles Fase 3 acima permanecem válidos. A matriz abaixo cobre apenas as novas boundaries distribuídas.

## ASVS e controles técnicos

| Controle | Requisito Fase 4 | Estado | Evidência/critério |
|---|---|---|---|
| V1.2/V1.4 | Requisitos e threat model de pagamento/mensageria | **Met (desenho)** | requisitos, ADR-013–018, extensão do threat model |
| V2.1 | Validar REST, webhook e envelope de mensagens | **Planejado** | ValidationPipe + JSON schema versionado |
| V4.1/V4.2 | Menor privilégio em filas, tópicos e tabelas | **Planejado** | IRSA por OS/Billing/Execution; deny-by-default |
| V6.1 | Tokens MP e segredos de webhook fora do código | **Met (política)** | Secrets Manager; CI secret scan |
| V7.1 | Lockfile e audit por serviço | **Planejado** | audit prod em OS/Billing/Execution/auth |
| V8.1 | Dados em trânsito/repouso e segregados | **Planejado** | TLS; RDS/DynamoDB/SQS/SNS criptografados; database-per-service |
| V10.1 | Auditabilidade sem PII/segredo | **Planejado** | logs JSON com redaction, `sagaId` e `correlationId` |
| V14.1 | Boundary HTTP e webhook endurecida | **Planejado** | HTTPS, assinatura, timestamp, rate limit e body limit |

## Controles por componente

| Componente | Controles bloqueantes |
|---|---|
| OS Service | lock otimista da Saga; outbox; transições allowlist; IRSA publish/consume mínimo |
| Billing Service | idempotência; confirmação server-to-server; segredo MP; refund/reconciliação; sem PAN/CVV |
| Execution Service | inbox; validação de passo; cancelamento idempotente; tabela própria |
| SQS/SNS | policies por ARN, TLS, criptografia, DLQ, redrive autorizado, payload mínimo |
| DynamoDB | tabela/role por serviço, PITR quando persistente, TTL só técnico, sem scan crítico |
| Observabilidade | redaction de CPF/token; trace/correlation; alarmes DLQ, Saga parada e refund |
| CI/CD | OIDC, scans, coverage/Sonar 90%, imagem não-root e promoção independente |

## Security release checklist Fase 4

- [x] Threat model e controls matrix atualizados antes da implementação.
- [x] Nenhum segredo real adicionado na Entrega 0–1.
- [ ] Contract tests cobrem schema, duplicidade, replay e out-of-order.
- [ ] Testes sandbox cobrem assinatura inválida, divergência de valor e refund.
- [ ] IaC comprova IRSA mínimo, criptografia, DLQ e isolamento de tabelas.
- [ ] Audits dos três serviços e auth sem vulnerabilidade crítica não aceita.
- [ ] Smoke confirma acesso negado a banco/fila de outro serviço.

## Gate

`gate-security-review`: **PASS de desenho, condicionado**. Entrega 2 deve converter controles planejados em IaC; Entregas 3–5 devem produzir audit/testes. Qualquer segredo no diff, acesso cross-service ou webhook sem validação reabre o gate e bloqueia deploy.
