# CI/CD — 4 remotes (Fase 3 pós-cisão)

| Repo | Workflow | PR | Push `develop`/`master` |
|------|----------|----|------------------------|
| [autoservicemanager-app](https://github.com/dinhogt/autoservicemanager-app) | `ci-cd.yml` | lint, arch, test:cov, build, docker + `security-gate` | OIDC → ECR → migrate Job → EKS |
| [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) | `ci-cd.yml` | install Packages, test, esbuild + `security-gate` | OIDC → `UpdateFunctionCode` |
| [autoservicemanager-infra-db](https://github.com/dinhogt/autoservicemanager-infra-db) | `ci-cd.yml` | fmt + validate (sem AWS) + `security-gate` | OIDC → plan `-out` → apply; state `db/<env>/` |
| [autoservicemanager-infra-k8s](https://github.com/dinhogt/autoservicemanager-infra-k8s) | `ci-cd.yml` | fmt + validate (sem AWS) + `security-gate` | OIDC → plan `-out` → apply; state `k8s/<env>/` |

Publish pacote: app [`publish-domain-shared.yml`](../../.github/workflows/publish-domain-shared.yml) (tag `domain-shared-v*`) → `@dinhogt/domain-shared` no GitHub Packages → consumido pelo auth-lambda.

Ordem de apply: **db → k8s → lambda → app**. Destroy: **app/lambda → k8s → db**.

Secrets GitHub: `AWS_ROLE_ARN` (OIDC). Variável opcional: `TF_STATE_BUCKET`. Detalhe por repo e branch protection: [branch-protection.md](./branch-protection.md).

Rollback: imagem/tag anterior (app), zip Lambda anterior, ou `terraform apply` do plan anterior; state versionado no S3.
