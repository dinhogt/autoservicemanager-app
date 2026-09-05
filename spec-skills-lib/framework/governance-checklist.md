# Governança Tecnológica — Checklist OPC

Every technology choice in architecture, cloud, finops, and ai-engineering roles **must** answer these six questions.

## Questions (mandatory)

| # | Question | Pass criteria |
|---|----------|---------------|
| 1 | Reduces or increases complexity? | Must reduce or stay neutral vs alternatives |
| 2 | Operable by one person? | Yes, with AI/automation support |
| 3 | Simpler alternative exists? | Document why simpler option was rejected |
| 4 | AI generates quality code for it? | Yes for official stack; document gaps otherwise |
| 5 | Operational cost compatible with Micro SaaS? | Monthly infra < 15% projected MRR at 1K users |
| 6 | Viable at scale tiers? | Document 100 / 1K / 10K / 100K user path |

## Classifications

| Classification | When to use |
|----------------|-------------|
| **Recomendada** | All 6 answers pass |
| **Uso Excepcional** | Passes 4–5; requires ADR justification |
| **Complexidade Elevada** | Fails #1 or #2; avoid unless no alternative |
| **Não Recomendada** | Fails #5 or #6 at target scale; do not adopt |

## Official stack verdicts (v0.4)

| Technology | Classification | Notes |
|------------|----------------|-------|
| Next.js + React + TypeScript | Recomendada | AI codegen excellent; OPC operable |
| NestJS + Prisma + MySQL | Recomendada | Modular monolith; scales to 100K with tuning |
| Redis | Recomendada | Cache, sessions, queues |
| NATS | Recomendada | Event-driven; lighter than Kafka for OPC |
| OCI | Recomendada (bootstrap) | Best cost-benefit for MVP/early growth |
| AWS | Uso Excepcional (scale-up) | Enterprise readiness; higher ops burden |
| GCP | Uso Excepcional (AI/analytics) | Vertex AI, BigQuery; use when AI product |
| Kafka | Uso Excepcional | Only at 10K+ events/sec or multi-service |
| Java/Spring, Python/Django, Go, .NET, Rust | Uso Excepcional | Market reference only; not official OPC stack |

## Scale viability template

Document in ADR or cloud evaluation:

```markdown
| Tier | Users | Infra approach | Est. monthly cost | OPC operable? |
|------|-------|----------------|-------------------|---------------|
| Bootstrap | 100 | OCI Container Instances + managed MySQL | $50–150 | Yes |
| Growth | 1,000 | OCI OKE or AWS ECS Fargate | $200–800 | Yes |
| Scale | 10,000 | OKE/EKS + Redis cluster + CDN | $1K–5K | Yes with automation |
| Enterprise | 100,000 | Multi-AZ, read replicas, queue workers | $5K–20K | Partial; consider hire |
```

## Integration in roles

Roles `architecture`, `cloud`, `finops`, and `ai-engineering` must include a **Governance** section in artifacts referencing this checklist.
