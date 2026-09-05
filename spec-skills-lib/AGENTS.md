# AGENTS.md — Spec-Skills contract

This repository uses **spec-skills-lib** for structured, local-first agent engineering — optimized for **Micro SaaS OPC** (One Person Company + AI First).

## Read order

1. `spec-skills-lib/rules/global-rules.yaml` (+ `global-rules.override.yaml` if present)
2. Active flow: `spec-skills-lib/flows/<flow_config.active_flow>.yaml`
3. Stack playbook: `spec-skills-lib/playbooks/stacks/<technologies.stack_profile>.yaml`
4. Security: `spec-skills-lib/rules/security-playbook.yaml`
5. Current role: `spec-skills-lib/roles/<role>/spec.md`
6. Specialist boundaries: `spec-skills-lib/roles/_boundaries.md`
7. OPC mode (when enabled): `spec-skills-lib/framework/opc-mode.md`

## Flow selection

| Profile | Flow file |
|---------|-----------|
| `opc_mode: true` | `opc-flow.yaml` (**default v0.4**) |
| `complexity_profile: low` (opc off) | `default-flow.yaml` |
| `complexity_profile: high` | `complex-flow.yaml` |

See `spec-skills-lib/rules/complexity-profile.yaml` for signals.

## Pipeline opc-flow v0.4

`business` → **`discovery`** → **`digital-business`** → **`saas`** → `requirements` → **`ux`** → **`copywriting`** → `architecture` → [**`ai-engineering`**] → **`cloud`** → `security` → **`legal`** → **`finops`** → `frontend` + `backend` → **`automation`** → `documentation` → `observability` → `qa` → **`saas-ops`** → `support-debug` → **`growth`**

Skip **`ai-engineering`** when `flow_config.ai_features_enabled: false`.

**default-flow v0.3** (unchanged): `business` → `digital-business` → `saas` → … → `support-debug`

**complex-flow:** same upstream as default; after **`finops`** → **`infrastructure`** → `frontend` + `backend` → …

Run **only the role for the current stage** in the active flow YAML.

### Specialist roles (one mission each)

| Role | Delivers |
|------|----------|
| `discovery` | Market validation, ICP, JTBD (`docs/discovery/`) |
| `digital-business` | Sustainability and profitability (`docs/digital-business/`) |
| `saas` | Product approach for startups (`docs/saas/`) |
| `ux` | Wireframes, design system, a11y (`docs/ux/`) |
| `copywriting` | Sales strategy (`docs/copy/`) |
| `ai-engineering` | AI architecture, RAG, agents (`docs/ai/`) |
| `cloud` | Best cloud option — OCI-first (`docs/cloud/`) |
| `legal` | ToS, privacy, LGPD/GDPR (`docs/legal/`) |
| `finops` | Lowest implementation cost (`docs/finops/`) |
| `automation` | n8n workflows (`docs/automation/`) |
| `saas-ops` | Stripe billing, tenants (`docs/saas-ops/`) |
| `growth` | PLG, SEO, retention (`docs/growth/`) |

## Official stack (OPC)

- **Playbook:** `nestjs-next-react`
- **Cloud:** `cloud_preference: oci-first`

## Framework

- `spec-skills-lib/framework/skills-map.yaml`
- `spec-skills-lib/framework/maturity-matrix.yaml`
- `spec-skills-lib/framework/priority-matrix.yaml`
- `spec-skills-lib/framework/ai-augmentation-matrix.yaml`
- `spec-skills-lib/framework/learning-roadmap.yaml`

## Migration 0.3 → 0.4

See `docs/migration-0.3-to-0.4.md`. Re-run `install-ide-integration.sh . --ide all` after upgrading.

## Artifacts

Store deliverables under `docs/` per role handoff.

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

## Validation

```bash
bash spec-skills-lib/tools/validate-local.sh
bash spec-skills-lib/tools/run-pipeline.sh status
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
