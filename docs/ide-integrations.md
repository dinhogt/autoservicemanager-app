# IDE integrations (Spec-Skills)

This project uses **spec-skills-lib** for structured agent engineering. Integrations are installed locally (not committed to git).

## Prerequisites

- `spec-skills-lib/` copied into the project root (gitignored)
- Python 3 with `pyyaml` and `jsonschema`: `pip install pyyaml jsonschema`

## Install integrations

From the repository root:

```bash
# Cursor only
bash spec-skills-lib/tools/install-ide-integration.sh . --ide cursor

# VS Code / GitHub Copilot
bash spec-skills-lib/tools/install-ide-integration.sh . --ide vscode

# All IDEs (Cursor + VS Code + Antigravity)
bash spec-skills-lib/tools/install-ide-integration.sh . --ide all
```

Options:

| Flag | Effect |
|------|--------|
| `--symlink` | Symlink instead of copy |
| `--no-overwrite` | Skip files that already exist |
| `--global` | Append Antigravity snippet to `~/.gemini/GEMINI.md` |

## What gets installed

### Cursor (`.cursor/` — gitignored)

| Path | Purpose |
|------|---------|
| `.cursor/rules/spec-skills-orchestrator.mdc` | Pipeline orchestration (`alwaysApply: true`) |
| `.cursor/rules/security-guardrails.mdc` | Security constraints (`alwaysApply: true`) |
| `.cursor/rules/complex-project.mdc` | Complex-flow guidance (`alwaysApply: false`) |
| `.cursor/skills/*` | Framework and role skills |
| `.cursor/agents/*` | Subagent definitions |

**After install:** open **Cursor Settings → Project Rules** and confirm the three rules are enabled.

### VS Code / Copilot (`.github/` — versioned)

| Path | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Root Copilot instructions |
| `.github/instructions/*.instructions.md` | Per-domain instructions (backend, frontend, security, infrastructure) |

These files are already versioned in this repository; re-running the installer overwrites them from `spec-skills-lib/integrations/vscode/`.

### Antigravity (`.agents/` — versioned)

| Path | Purpose |
|------|---------|
| `.agents/rules/` | Orchestrator, security, stack playbooks |
| `.agents/workflows/` | Pipeline workflows |
| `.agents/skills/` | Role skills |

Already present in git for this project. Re-run with `--ide antigravity` only if you need to refresh from the library.

## Stack profile override

Merge project settings into `spec-skills-lib/rules/global-rules.override.yaml`:

```yaml
technologies:
  stack_profile: "nestjs-next-react"
flow_config:
  active_flow: "default-flow"
  complexity_profile: "low"
  opc_mode: false
```

Detect stack automatically:

```bash
bash spec-skills-lib/tools/detect-stack.sh .
```

## Validation

```bash
bash spec-skills-lib/tools/validate-local.sh
```

## Read order for agents

1. [`AGENTS.md`](../AGENTS.md) at repository root
2. `spec-skills-lib/rules/global-rules.yaml` (+ `global-rules.override.yaml`)
3. Active flow: `spec-skills-lib/flows/<active_flow>.yaml`
4. Stack playbook: `spec-skills-lib/playbooks/stacks/<stack_profile>.yaml`
5. Security: `spec-skills-lib/rules/security-playbook.yaml`
6. Current role: `spec-skills-lib/roles/<role>/spec.md`

## Project-specific skills (versioned)

Engineering role skills under [`.agents/skills/`](../.agents/skills/) are tracked in git and complement the Cursor integration:

- `role-backend`, `role-frontend`, `role-security`, `role-architecture`
- `role-qa`, `role-observability`, `role-documentation`
- `spec-skills-orchestrator`, `stack-playbook`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `spec-skills-lib/` missing | Copy from another project or restore from backup |
| `validate-local.sh` fails on missing files | Re-copy full `spec-skills-lib/` directory |
| Cursor rules not applied | Settings → Project Rules → enable rules |
| `pip install pyyaml jsonschema` needed | Install Python deps before validation |
