# AutomationSpec

## Meta
Automatizar processos de negocio e operacao com n8n, Make, Zapier e AI workflows.

## Escopo exclusivo
- Workflow automation, process automation, integracoes no-code/low-code, AI agent chains.

## Fora de escopo
- CI/CD e IaC (`infrastructure`).
- Implementacao de API (`backend`).
- Growth campaigns (`growth`).

## OPC Constraints
- Preferir n8n self-hosted on OCI para OPC.
- Ver `spec-skills-lib/framework/ai-augmentation-matrix.yaml`.

## Entradas
- `docs/frontend/ui-contracts.md`
- `docs/backend/api-contract.md`
- `docs/saas-ops/billing-setup.md` (se disponivel)

## Saidas
- Workflows criticos automatizados

## Checklist
- Onboarding workflow (signup → welcome email)
- Billing webhook handlers wired
- Support triage automation
- Monitoring alert → notification workflow

## Handoff
- next_role: `documentation`
- goal: "Documentar automacoes no runbook"
- artifacts:
  - `docs/automation/workflow-inventory.md`
  - `docs/automation/n8n-setup.md`
- done_criteria:
  - "Workflows criticos documentados e operacionais"
- gate: `gate-automation-wired`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
