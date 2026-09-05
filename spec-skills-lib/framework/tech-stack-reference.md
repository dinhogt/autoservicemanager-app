# Tech Stack de Referência — Micro SaaS OPC v0.4

Official stack: **Maximum Business Value with Minimum Technology Diversity**.

Playbook id: `nestjs-next-react`

## Frontend

| Technology | Justification | 100 users | 1K | 10K | 100K |
|------------|---------------|-----------|-----|-----|------|
| **TypeScript** | Type safety; AI codegen quality | Yes | Yes | Yes | Yes |
| **React** | Ecosystem; component reuse | Yes | Yes | Yes | Yes |
| **Next.js 15+** | SSR/SSG/ISR, SEO, App Router | Yes | Yes | Yes | Yes (edge/CDN) |
| **Tailwind CSS** | Rapid UI; no CSS sprawl | Yes | Yes | Yes | Yes |
| **Shadcn/UI** | Accessible components; copy-paste | Yes | Yes | Yes | Yes |

**Anti-patterns:** Multiple CSS frameworks; client-only SPA when SEO matters; custom design system before PMF.

## Backend

| Technology | Justification | OPC operable |
|------------|---------------|--------------|
| **Node.js LTS** | Same language as frontend; hiring N/A for OPC | Yes |
| **NestJS** | Modular monolith; DI; OpenAPI; testable | Yes |
| **Prisma** | Type-safe ORM; migrations; AI-friendly | Yes |
| **MySQL** | Managed options on OCI/AWS; proven multi-tenant | Yes |
| **Redis** | Cache, sessions, rate limits, job queues | Yes |
| **NATS** | Lightweight pub/sub; event-driven without Kafka ops | Yes |

**Not official (reference only):** Java/Spring, Python, Go, .NET — classify as Uso Excepcional per governance checklist.

## Data

- **MySQL:** Primary datastore; schema-per-tenant or shared DB with `tenant_id`
- **Redis:** Hot cache, session store, Bull/NATS bridge
- **Event storage:** NATS JetStream or MySQL outbox pattern

## AI layer

| Tool | Use case | OPC default |
|------|----------|-------------|
| OpenAI / Anthropic / Gemini | LLM inference | Via OpenRouter for flexibility |
| LangGraph | Agent orchestration | When product has AI features |
| LangChain | RAG pipelines | When product has AI features |
| MCP | Tool integration for agents | Cursor/IDE and product agents |

## Cloud order

1. **OCI** — bootstrap, MVP, early growth (Compute, OKE, Functions, Object Storage, LB)
2. **AWS** — scale-up, enterprise (ECS Fargate, RDS, CloudFront, Cognito)
3. **GCP** — AI products, analytics (Cloud Run, Vertex AI, BigQuery)

## DevOps

- Git + GitHub Flow + trunk-based development
- GitHub Actions CI/CD
- Terraform IaC
- Feature flags (Posthog or LaunchDarkly lite)

## Quality

- Jest (unit/integration), Supertest (API), Playwright (E2E)
- Target: 80% coverage on critical paths

## Security

- OAuth2/OIDC, JWT, RBAC
- ASVS L1 (MVP) → L2 (production)
- LGPD/GDPR via legal role artifacts

## SaaS operations

- **Stripe** — billing, subscriptions, customer portal
- **Posthog** — product analytics, feature flags, session replay

## Automation

- **n8n** (self-hosted on OCI) — workflows, webhooks, AI chains
- Make/Zapier — optional for non-technical integrations

## Governance summary

All official stack technologies pass the six governance questions for OPC at 100–10K users. At 100K, plan read replicas, CDN, and optional AWS migration — document in cloud evaluation.

See also: `spec-skills-lib/playbooks/stacks/nestjs-next-react.yaml`, `framework/governance-checklist.md`.
