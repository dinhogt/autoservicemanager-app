# Diagrama de arquitetura — Fase 2 (ambiente local)

Ambiente de demonstração: **Kubernetes local (kind)** + **Docker Compose (DB)** + **CI GitHub Actions**.

## Visão geral

```mermaid
flowchart TB
  subgraph dev [Desenvolvedor]
    IDE[IDE_NestJS]
    TF[Terraform_local]
    KSetup[kind-setup.sh]
  end

  subgraph cicd [GitHub_Actions]
    Lint[lint]
    Test[test:cov]
    Build[nest_build]
    DockerBuild[docker_build]
    Lint --> Test --> Build --> DockerBuild
  end

  subgraph host [Maquina_local]
    Compose[docker-compose.db.yml]
    Kind[kind_cluster]
    Compose --> MySQL[(MySQL_3306)]
    Compose --> Mongo[(MongoDB_27017)]
    Kind --> Deploy[Deployment_API_x2]
    Kind --> Svc[Service_NodePort_30080]
    Kind --> HPA[HPA_1-5_pods]
    HPA --> Deploy
    Svc --> Deploy
  end

  subgraph app [AutoServiceManager]
    HTTP[Controllers_REST]
    UC[Use_Cases]
    Domain[Domain_DDD]
    Prisma[Prisma_MySQL]
    Audit[Mongo_Audit]
    Email[SMTP_Email]
    HTTP --> UC --> Domain
    UC --> Prisma
    UC --> Audit
    UC --> Email
  end

  Deploy --> app
  Prisma --> MySQL
  Audit --> Mongo

  TF --> Kind
  TF --> Compose
  KSetup --> Kind
  DockerBuild -.->|kind_load| Kind
```

## Fluxo de deploy (demo)

```mermaid
sequenceDiagram
  participant Dev as Desenvolvedor
  participant GHA as GitHub_Actions
  participant DC as Docker_Compose
  participant K8s as kind_Kubernetes
  participant API as API_Pods

  Dev->>DC: docker compose up mysql mongodb
  Dev->>K8s: kind create + kubectl apply
  Dev->>K8s: kind load docker-image
  GHA->>GHA: lint test build docker
  K8s->>API: Deployment + HPA + migrate Job
  API->>DC: DATABASE_URL host.docker.internal
  Dev->>API: Postman/Swagger smoke test
  Dev->>API: load-test.sh para HPA
```

## APIs críticas Fase 2

| API | Método | Autenticação |
|-----|--------|--------------|
| Abertura OS | `POST /ordens-servico` | Pública |
| Status OS | `GET /ordens-servico/:id/status` | CPF/placa |
| Aprovação orçamento | `POST /ordens-servico/:id/aprovacoes` | CPF/placa |
| Listagem admin | `GET /admin/ordens-servico` | JWT |
| Webhook status | `POST /webhooks/os/:id/status` | X-Webhook-Secret |
| E-mail | Side effect em transições | SMTP |

## Path alternativo (cloud)

Para produção acadêmica alternativa, ver [`solution-design.md`](./solution-design.md) e [`../runbook-deploy-eks.md`](../runbook-deploy-eks.md): AWS EKS + RDS + ECR via [`../../infra/terraform/environments/dev/`](../../infra/terraform/environments/dev/).

## Componentes por pasta

| Pasta | Conteúdo |
|-------|----------|
| `src/domain/` | Entidades, regras, ports |
| `src/application/` | Use cases |
| `src/infrastructure/` | Prisma, Mongo, e-mail, auth |
| `src/interfaces/http/` | Controllers REST |
| `k8s/local/` | Manifestos kind |
| `infra/terraform/local/` | Cluster kind + compose DB |
| `.github/workflows/ci-cd.yml` | Pipeline CI (+ CD AWS opcional) |
