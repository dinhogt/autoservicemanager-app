# Spec-Skills Lib (v0.4.0)

Biblioteca local-first de spec-skills para agents de desenvolvimento Micro SaaS OPC (One Person Company + AI First): fluxo upstream→downstream, framework de competências, stack oficial NestJS+Next.js, cloud OCI-first.

## Objetivo

- Padronizar engenharia com **23 papéis** no pipeline v0.4 (16 originais + 7 OPC: `discovery`, `ux`, `ai-engineering`, `legal`, `automation`, `growth`, `saas-ops`)
- **opc-flow** dedicado para solo founders construindo Micro SaaS
- Framework de competências em `framework/` (skills map, matrizes, learning roadmap)
- Stack oficial: **NestJS + Next.js + Prisma + MySQL + Redis**
- Cloud preference: **OCI-first** → AWS → GCP
- Suportar **Cursor**, **VS Code (Copilot)** e **Antigravity**

## Estrutura

- `schema/` — JSON Schema (`CoreSpec`, `GlobalRules`, `FlowSpec`, `FrameworkSpec`)
- `rules/` — `global-rules.yaml`, `security-playbook.yaml`, `complexity-profile.yaml`
- `roles/` — specs por papel (23 roles)
- `flows/` — `opc-flow.yaml`, `default-flow.yaml`, `complex-flow.yaml`
- `framework/` — OPC mode, governance, skills map, matrizes, arquiteturas de referência
- `playbooks/stacks/` — `nestjs-next-react` (oficial) + TypeScript, Python, Go, Java, .NET, Rust
- `integrations/` — adaptadores Cursor, VS Code, Antigravity
- `tools/` — bootstrap, validate, detect-stack, install-ide-integration
- `AGENTS.md` — contrato canônico

## Quickstart (OPC Micro SaaS)

```bash
bash tools/bootstrap-project.sh /caminho/do/projeto --with-all-ides
bash tools/detect-stack.sh /caminho/do/projeto
pip install pyyaml jsonschema
bash tools/validate-local.sh
```

Default em `global-rules.yaml`:

```yaml
flow_config:
  active_flow: opc-flow
  opc_mode: true
technologies:
  stack_profile: nestjs-next-react
  cloud_preference: oci-first
```

## Fluxos

| Fluxo | Quando |
|-------|--------|
| `opc-flow` | Micro SaaS OPC (`opc_mode: true`) — **default v0.4** |
| `default-flow` | Projetos tradicionais v0.3 (`complexity_profile: low`) |
| `complex-flow` | Multi-serviço, regulado, IaC (`complexity_profile: high`) |

## Pipeline opc-flow

`business` → `discovery` → `digital-business` → `saas` → `requirements` → `ux` → `copywriting` → `architecture` → [`ai-engineering`] → `cloud` → `security` → `legal` → `finops` → `frontend` + `backend` → `automation` → `documentation` → `observability` → `qa` → `saas-ops` → `support-debug` → `growth`

## Framework OPC

- `framework/opc-mode.md` — manual vs IA vs automação vs agente
- `framework/skills-map.yaml` — mapa hierárquico de competências
- `framework/maturity-matrix.yaml` — níveis Iniciante → Especialista
- `framework/priority-matrix.yaml` — Essencial / Importante / Desejável
- `framework/ai-augmentation-matrix.yaml` — matriz de augmentação IA
- `framework/learning-roadmap.yaml` — MVP Builder → Portfolio Builder
- `framework/architecture/reference/` — C4, OCI, AWS, GCP, multi-tenant, AI

## Integrações IDE

```bash
bash tools/install-ide-integration.sh . --ide all
```

Ver `../docs/ide-integrations.md` e `../docs/migration-0.3-to-0.4.md`.

## Migration 0.3 → 0.4

Projetos existentes: manter `active_flow: default-flow` e `opc_mode: false` em override. Ver `../docs/migration-0.3-to-0.4.md`.
