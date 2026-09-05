# CI/CD — stacks infra (Fase 3)

| Stack | Workflow | PR | Push `develop`/`master` |
|-------|----------|----|------------------------|
| [infra-db](../../infra-db/) | `infra-db-ci-cd.yml` | fmt + validate (sem AWS) | OIDC → plan `-out` → apply; state `db/<env>/` |
| [infra-k8s](../../infra-k8s/) | `infra-k8s-ci-cd.yml` | fmt + validate (sem AWS) | OIDC → plan `-out` → apply; state `k8s/<env>/` |

Ordem de apply: **db → k8s**. Destroy: **k8s → db**.

Secrets GitHub: `AWS_ROLE_ARN` (OIDC). Variável opcional: `TF_STATE_BUCKET`.

Governança de branch / environments / colaborador: [branch-protection.md](./branch-protection.md).

Rollback: `terraform apply` do plan anterior ou `destroy` do stack afetado; state versionado no S3.
