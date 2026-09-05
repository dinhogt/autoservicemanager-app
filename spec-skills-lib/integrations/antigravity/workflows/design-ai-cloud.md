# Workflow: design AI and cloud

Run technical design stages from `opc-flow.yaml`.

## Stages

1. `architecture` — solution design, ADR
2. `ai-engineering` — skip if `ai_features_enabled: false`
3. `cloud` — OCI-first evaluation
4. `security` — threat model
5. `legal` — compliance
6. `finops` — implementation cost

## References

- `spec-skills-lib/framework/architecture/reference/`
- `spec-skills-lib/framework/governance-checklist.md`

## Gates

- `gate-architecture-quality`
- `gate-ai-architecture` (conditional)
- `gate-cloud-selection`
- `gate-security-review`
- `gate-legal-compliance`
- `gate-finops-implementation-cost`
