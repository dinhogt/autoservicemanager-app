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
| `@autoservicemanager/domain-shared` | Coberto pelo workspace atual | Sem deps vulneráveis próprias |
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
