# AGENTS.md — Spec-Skills contract

This repository uses **spec-skills-lib** for structured, local-first agent engineering.

## Read order

1. `spec-skills-lib/rules/global-rules.yaml` (+ `global-rules.override.yaml` if present)
2. Active flow: `spec-skills-lib/flows/<flow_config.active_flow>.yaml`
3. Stack playbook: `spec-skills-lib/playbooks/stacks/<technologies.stack_profile>.yaml`
4. Security: `spec-skills-lib/rules/security-playbook.yaml`
5. Current role: `spec-skills-lib/roles/<role>/spec.md`

## Flow selection

| Profile | Flow file |
|---------|-----------|
| `complexity_profile: low` | `default-flow.yaml` |
| `complexity_profile: high` | `complex-flow.yaml` |

See `spec-skills-lib/rules/complexity-profile.yaml` for signals.

## Pipeline (default-flow)

`business` → `requirements` → `architecture` → **`security`** → `frontend` + `backend` → `documentation` → `observability` → `qa` → `support-debug`

Complex-flow adds **`infrastructure`** after security and requires WBS/epics when complexity is high.

## Artifacts

Store deliverables under `docs/` per role handoff (e.g. `docs/security/threat-model.md`, `docs/architecture/adr-001.md`).

## Security (non-negotiable)

- No secrets in the repository
- Threat model when boundaries change
- Dependency audit per stack playbook before completing work
- Pass `gate-security-review` before implementation

## Stack detection

```bash
bash spec-skills-lib/tools/detect-stack.sh .
```

## IDE integrations

```bash
bash spec-skills-lib/tools/install-ide-integration.sh . --ide all
```

See `docs/ide-integrations.md` for Cursor, VS Code, and Antigravity setup.

## Validation

```bash
bash spec-skills-lib/tools/validate-local.sh
```

Requires: `python3`, `pyyaml`, `jsonschema`

## Remote execution (opt-in)

Default is local-only. To allow package registries and vulnerability DBs in production, set:

```yaml
execution_profile:
  active_profile: production_remote
  remote_calls_allowed: true
```

Only after explicit team approval (`requires_explicit_opt_in`).
