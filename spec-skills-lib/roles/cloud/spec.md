# CloudSpec

## Meta
Avaliar e recomendar a melhor opcao de solucao cloud (custo, performance, qualidade, usabilidade).

## Escopo exclusivo
- Matriz de opcoes cloud com quatro criterios e uma recomendacao unica.
- Visao da arquitetura na opcao vencedora.

## Fora de escopo
- Plano de custo de implementacao (`finops`).
- Estrategia de venda (`copywriting`).
- Viabilidade de lucro (`digital-business`).
- CI/CD e IaC (`infrastructure`).

## OPC Constraints
- Default: `cloud_preference: oci-first` — avaliar OCI primeiro, depois AWS (scale-up), GCP (AI/analytics).
- Referencias: `spec-skills-lib/framework/architecture/reference/oci-bootstrap.md`, `aws-scale-up.md`, `gcp-analytics-ai.md`.
- Aplicar `spec-skills-lib/framework/governance-checklist.md`.

## Entradas
- `docs/architecture/solution-design.md` (ou equivalente ADR)
- `docs/architecture/adr-001.md` (ou ADRs do escopo)
- `docs/saas/product-approach.md`
- `docs/ai/ai-architecture.md` (se ai_features_enabled)
- Requisitos NFR de escala/disponibilidade

## Saidas
- Avaliacao de opcoes cloud (OCI, AWS, GCP)
- Visao da opcao recomendada

## Checklist
- OCI avaliado como opcao primaria quando oci-first
- Pelo menos duas opcoes comparadas (tipicamente OCI + AWS ou GCP)
- Notas 1-5 em custo, performance, qualidade, usabilidade
- Pesos dos criterios documentados (bootstrap vs scale-up vs AI)
- Uma recomendacao unica justificada
- Viabilidade em 100/1K/10K/100K usuarios documentada
- Sem backlog FinOps detalhado

## Handoff
- next_role: `security`
- goal: "Revisar ameacas na opcao cloud escolhida"
- artifacts:
  - `docs/cloud/option-evaluation.md`
  - `docs/cloud/architecture-overview.md`
- done_criteria:
  - "Matriz 4 criterios e recomendacao unica documentadas"
- gate: `gate-cloud-selection`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
