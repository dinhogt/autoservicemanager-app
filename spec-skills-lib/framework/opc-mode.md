# ONE PERSON COMPANY MODE (OPC)

Cross-cutting operating model for solo founders building Micro SaaS with AI, agents, and automation.

**Applies when:** `flow_config.opc_mode: true` and `active_flow: opc-flow`.

## Principles

- Maximum business value with minimum technology diversity
- Lean Startup: Build → Measure → Learn
- AI First: copilot, executor, analyst, autonomous agent, automation
- One person operates all functions with AI augmentation

## Activity matrix

| Area | Manual | IA Assistida | Automação | Agente Autônomo |
|------|--------|--------------|-----------|-----------------|
| **Estratégia** | Vision, prioritization | Market research, competitive analysis | Trend alerts (Google Trends) | Discovery agent (Reddit, PH scan) |
| **Produto** | Final roadmap decisions | User story drafting, RICE scoring | Backlog sync (Linear/GitHub) | Requirements agent from discovery |
| **UX/UI** | Brand, final UX calls | Wireframes, design system tokens | Figma → code (Shadcn) | UX review agent (a11y, heuristics) |
| **Desenvolvimento** | Architecture decisions, code review | Code generation (NestJS, Next.js) | CI/CD, lint, test on push | Implementation agents (frontend/backend) |
| **Arquitetura** | ADR approval, boundary calls | C4 diagrams, pattern suggestions | Schema validation in CI | Architecture review agent |
| **DevOps** | Release approval | Terraform/IaC generation | GitHub Actions pipelines | Deploy agent (OCI/AWS) |
| **Cloud** | Provider selection sign-off | Cost comparison, OCI/AWS/GCP matrix | Monitoring alerts | FinOps cost anomaly agent |
| **Segurança** | Threat model approval | ASVS mapping, OWASP checks | Dependency audit in CI | Security scan agent |
| **Marketing** | Brand voice, campaign strategy | Copy drafts, landing pages | Email sequences (n8n) | SEO audit agent |
| **Vendas** | High-value deals | Lead scoring, outreach drafts | CRM sync (HubSpot/Pipedrive) | Outbound automation agent |
| **Atendimento** | Escalations, empathy | Ticket triage, FAQ drafts | Support bot (Stripe portal) | Support-debug agent |
| **Financeiro** | Pricing decisions | Unit economics, P&L models | Stripe webhooks, MRR dashboards | Churn alert agent |
| **Compliance** | Legal sign-off | ToS/privacy drafts (LGPD/GDPR) | Cookie consent, audit logs | Compliance checklist agent |

## OPC constraints for all roles

1. Prefer official stack: `nestjs-next-react` (Next.js + NestJS + Prisma + MySQL + Redis)
2. Cloud preference: OCI-first → AWS scale-up → GCP analytics/AI
3. Limit open risks to 3 per handoff
4. Caveman mode default; escalate to normal on gate failure
5. No technology that fails governance checklist (see `governance-checklist.md`)
6. Artifacts under `docs/<domain>/` per role handoff

## Time budget (solo founder)

| Phase | Weekly hours | AI leverage |
|-------|--------------|-------------|
| Discovery + business | 4–8h | High (research agents) |
| Build (MVP) | 15–25h | Very high (code agents) |
| Launch + growth | 4–8h | High (automation) |
| Operate (per product) | 2–5h | Very high (monitoring, support bots) |

## Multi-product portfolio (Phase 4)

- Shared stack and infra templates across products
- Per-product pipeline runs with isolated `docs/` artifacts
- Central automation hub (n8n) for cross-product workflows
- FinOps agent monitors aggregate burn and runway
