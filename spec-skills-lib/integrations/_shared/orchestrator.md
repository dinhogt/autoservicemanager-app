# Spec-Skills orchestrator (shared)

Before coding, read in order:

1. `AGENTS.md` (project root)
2. `spec-skills-lib/rules/global-rules.yaml` (+ override if present)
3. Active flow from `flow_config.active_flow` in `spec-skills-lib/flows/`
4. Stack playbook: `spec-skills-lib/playbooks/stacks/<stack_profile>.yaml`
5. `spec-skills-lib/roles/_boundaries.md` when running specialist stages
6. `spec-skills-lib/framework/opc-mode.md` when `flow_config.opc_mode: true`

## Flow selection

| Condition | Flow |
|-----------|------|
| `opc_mode: true` | `opc-flow` (default v0.4 OPC) |
| `complexity_profile: high` | `complex-flow` |
| otherwise | `default-flow` |

## Pipeline opc-flow v0.4

Execute **only the role for the current stage**:

`business` → `discovery` → `digital-business` → `saas` → `requirements` → `ux` → `copywriting` → `architecture` → [`ai-engineering` if enabled] → `cloud` → `security` → `legal` → `finops` → `frontend` + `backend` → `automation` → `documentation` → `observability` → `qa` → `saas-ops` → `support-debug` → `growth`

- Skip `stage-ai-engineering` when `ai_features_enabled: false` (go `architecture` → `cloud`).
- Official stack: `nestjs-next-react`. Cloud: OCI-first.
- If `gate-digital-business-viability` fails, loop to `business`.
- If `gate-discovery-validated` fails, loop to `business`.

## Pipeline default-flow v0.3 (unchanged)

`business` → `digital-business` → `saas` → `requirements` → `copywriting` → `architecture` → `cloud` → `security` → `finops` → …

complex-flow: after `finops` → `infrastructure` → parallel `frontend` / `backend`.

Follow `spec-skills-lib/roles/<role>/spec.md` for the active stage.

Write artifacts under `docs/` as defined in each role handoff.

On gate failure in caveman mode, rerun only the failing stage in normal mode.
