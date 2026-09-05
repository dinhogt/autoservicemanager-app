# Terraform — ambiente local (kind + Docker Compose DB)

Provisiona o **cluster Kubernetes local** via [kind](https://kind.sigs.k8s.io/) e sobe **MySQL + MongoDB** via `docker-compose.db.yml`.

> Path alternativo cloud: [`../environments/dev/`](../environments/dev/) (AWS EKS + RDS).

## Recursos criados

| Recurso | Provider | Descrição |
|---------|----------|-----------|
| `kind_cluster.autoservice` | tehcyx/kind | Cluster Kubernetes local com NodePort 30080 |
| `null_resource.database_compose` | null | `docker compose -f docker-compose.db.yml up -d` |

O deploy da **API** (Deployment, Service, HPA, migrate) é feito via [`scripts/kind-setup.sh`](../../../scripts/kind-setup.sh) após o Terraform.

## Pré-requisitos

- Terraform >= 1.5
- Docker (Engine ou Desktop)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) instalado
- kubectl

## Apply

```bash
cd infra/terraform/local
terraform init
terraform plan
terraform apply
```

## Outputs

```bash
terraform output cluster_name
terraform output next_steps
```

## Destroy

```bash
terraform destroy
```

Isso remove o cluster kind e executa `docker compose down` do banco.

## Integração com CI/CD

A pipeline GitHub Actions executa **build + testes + docker build**. O deploy no cluster local é manual (ou via `kind-setup.sh`) após o CI — adequado para demonstração acadêmica.

## DATABASE_URL nos pods

Pods kind acessam MySQL/Mongo no host:

| SO | Host |
|----|------|
| macOS / Windows (Docker Desktop) | `host.docker.internal` |
| Linux | `172.17.0.1` (bridge Docker) |

Ver [`docs/runbook-deploy-local-k8s.md`](../../../docs/runbook-deploy-local-k8s.md).
