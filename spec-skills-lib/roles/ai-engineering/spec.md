# AiEngineeringSpec

## Meta
Projetar arquitetura de produto com IA: RAG, agents, MCP, LLMOps e avaliacao.

## Escopo exclusivo
- Prompt engineering, RAG, multi-agent, MCP, AI workflows, eval, fine-tuning path.

## Fora de escopo
- Arquitetura geral nao-AI (`architecture`).
- Selecao cloud generica (`cloud`) — apenas requisitos AI para cloud.
- FinOps de infra (`finops`).
- Implementacao backend generica (`backend`).

## OPC Constraints
- Executar apenas quando `flow_config.ai_features_enabled: true`.
- Aplicar `spec-skills-lib/framework/governance-checklist.md`.
- Referencia: `spec-skills-lib/framework/architecture/reference/ai-product-architecture.md`.

## Entradas
- `docs/architecture/solution-design.md`
- `docs/architecture/adr-001.md`
- `docs/saas/product-approach.md`

## Saidas
- Arquitetura AI documentada com eval e custos estimados

## Checklist
- Casos de uso AI mapeados (copilot vs agent vs automation)
- Pipeline RAG ou agent definido
- MCP tools listados se aplicavel
- Plano de eval e guardrails de seguranca AI
- Estimativa de custo LLM por usuario

## Handoff
- next_role: `cloud`
- goal: "Informar requisitos cloud para cargas AI"
- artifacts:
  - `docs/ai/ai-architecture.md`
  - `docs/ai/eval-plan.md`
  - `docs/ai/llm-cost-estimate.md`
- done_criteria:
  - "Arquitetura AI com eval e guardrails documentados"
- gate: `gate-ai-architecture`

## Modo Caveman
- Limite de ate 5 bullets por secao.
- Formato: `contexto`, `decisao`, `proximo_passo`.
