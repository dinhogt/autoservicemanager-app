# C4 Reference — Micro SaaS OPC

## Context diagram

```mermaid
flowchart TB
  User[Solo Founder / End User]
  Product[Micro SaaS Product]
  Stripe[Stripe]
  LLM[LLM Provider]
  OCI[OCI Cloud]

  User --> Product
  Product --> Stripe
  Product --> LLM
  Product --> OCI
```

## Container diagram

```mermaid
flowchart TB
  subgraph client [Client]
    Web[Next.js Web App]
  end
  subgraph backend [Backend]
    API[NestJS API]
    Worker[Background Workers]
  end
  subgraph data [Data]
    MySQL[(MySQL)]
    Redis[(Redis)]
    NATS[NATS]
  end
  subgraph external [External]
    Stripe[Stripe]
    Posthog[Posthog]
    LLM[OpenRouter/LLM]
  end

  Web --> API
  API --> MySQL
  API --> Redis
  API --> NATS
  Worker --> NATS
  Worker --> MySQL
  API --> Stripe
  Web --> Posthog
  API --> LLM
```

## Component diagram (NestJS API)

| Component | Responsibility |
|-----------|----------------|
| AuthModule | OAuth2/OIDC, JWT, RBAC |
| TenantModule | Multi-tenant context, isolation |
| BillingModule | Stripe webhooks, subscriptions |
| CoreModule | Domain logic |
| EventsModule | NATS publish/subscribe |
| AiModule | RAG, agents (optional) |

## OPC notes

- Start as modular monolith in `apps/api/`
- Extract services only at 10K+ users or clear boundary pain
- See `multi-tenant-saas.md` for tenant patterns
