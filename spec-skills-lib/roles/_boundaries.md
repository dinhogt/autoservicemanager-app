# Boundaries — specialist pipeline roles (v0.4)

Each role answers **one question**. Do not produce another role's artifacts in the same change-set.

## RACI — owner only

| Topic | Owner | Never do in this role |
|-------|-------|----------------------|
| Market opportunity validation (ICP, JTBD, competitive map) | `discovery` | digital-business, saas, copywriting |
| Sustainability and profitability | `digital-business` | finops, cloud, copywriting, saas, discovery |
| SaaS/startup product approach (MVP, PLG, tenant) | `saas` | digital-business, copywriting, cloud, saas-ops |
| UX wireframes, design system, a11y | `ux` | frontend, copywriting, growth |
| Sales strategy and commercial copy (launch) | `copywriting` | saas, digital-business, growth (SEO/retention) |
| Technical SEO, PLG loops, retention post-launch | `growth` | copywriting, saas-ops, digital-business |
| Solution architecture and ADRs | `architecture` | ai-engineering (AI-specific), cloud |
| AI product architecture (RAG, agents, MCP) | `ai-engineering` | architecture (general), backend |
| Cloud provider/service choice (cost as one of four criteria) | `cloud` | finops, saas, copywriting, digital-business |
| Threat model and ASVS controls | `security` | legal (policy text) |
| Legal compliance (ToS, privacy, LGPD/GDPR) | `legal` | security (technical controls), copywriting |
| Minimum implementation cost (setup → go-live) | `finops` | cloud (re-select provider), digital-business |
| Billing, tenants, churn ops | `saas-ops` | saas (product model), finops, growth |
| Business workflow automation (n8n, Zapier) | `automation` | infrastructure (CI/CD), growth |
| Problem statement (initial) | `business` | specialist roles before `stage-business` completes |
| CI/CD, IaC, rollback | `infrastructure` | cloud/finops only supply inputs |

## Cloud × FinOps

- **cloud:** `docs/cloud/option-evaluation.md` — matrix: cost, performance, quality, usability → one recommendation. OCI-first when `cloud_preference: oci-first`.
- **finops:** `docs/finops/implementation-cost-plan.md` — only after cloud decision; must not change provider/service choice.

## Copywriting × Growth

- **copywriting:** Launch messaging, ICP promise, funnel CTAs for initial release.
- **growth:** Post-launch SEO, retention, viral loops, cohort analysis — not launch copy.

## SaaS × SaaS-Ops

- **saas:** Product model (PLG, trial, tenant pattern, MVP scope).
- **saas-ops:** Stripe billing live, tenant ops, MRR/churn dashboards.

## Pipeline order (opc-flow mandatory)

`business` → `discovery` → `digital-business` → `saas` → `requirements` → `ux` → `copywriting` → `architecture` → [`ai-engineering` if AI] → `cloud` → `security` → `legal` → `finops` → …

## Pipeline order (default-flow v0.3 — unchanged)

`business` → `digital-business` → `saas` → `requirements` → `copywriting` → `architecture` → `cloud` → `security` → `finops` → …

## Escalation

| If the task is… | Use role |
|-----------------|----------|
| Is the market opportunity valid? | `discovery` |
| Is the project sustainable and profitable? | `digital-business` |
| Best approach for new digital product / startup? | `saas` |
| Wireframes and design system? | `ux` |
| How to sell / launch messaging? | `copywriting` |
| Post-launch SEO and retention? | `growth` |
| AI features (RAG, agents)? | `ai-engineering` |
| Which cloud option is best? | `cloud` |
| ToS and privacy compliance? | `legal` |
| How to implement with lowest delivery cost? | `finops` |
| Stripe billing and tenant ops? | `saas-ops` |
| n8n / workflow automation? | `automation` |

## Blocking gates

| Gate | Block |
|------|-------|
| `docs/digital-business/viability-summary.md` not viable | Do not proceed to `stage-saas`; feedback to `stage-business` |
| `docs/discovery/market-research.md` opportunity invalid | Do not proceed to `stage-digital-business`; feedback to `stage-business` |
| `gate-legal-compliance` fail | Feedback to `stage-security` |
