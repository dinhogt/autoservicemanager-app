# Project instructions (Spec-Skills)

This project uses **spec-skills-lib** for agent-driven engineering.

## Read first

1. [AGENTS.md](../AGENTS.md) at repository root
2. `spec-skills-lib/rules/global-rules.yaml`
3. Active flow: `spec-skills-lib/flows/<active_flow>.yaml`
4. Security: `spec-skills-lib/rules/security-playbook.yaml`

## Conventions

- Follow role specs in `spec-skills-lib/roles/<role>/spec.md` for the current pipeline stage.
- Store deliverables under `docs/` per role handoff.
- Never commit secrets. Run stack-specific dependency audits before completing work.
- Use `default-flow` for simple projects; use `complex-flow` when `complexity_profile` is `high`.

## Stack

Set `technologies.stack_profile` in global-rules or run `spec-skills-lib/tools/detect-stack.sh`.
