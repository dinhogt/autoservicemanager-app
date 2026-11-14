# Inventário de artefatos — Fase 4

Checklist do enunciado: **Dockerfile**, **manifestos Kubernetes**, **evidência de cobertura**, **Swagger/Postman** e **diagrama geral**.

## Diagrama geral

| Artefato | Caminho |
|---|---|
| Diagrama Geral de Arquitetura | [`docs/architecture/diagrams-fase4.md`](../architecture/diagrams-fase4.md#diagrama-geral-de-arquitetura) |
| Solution design | [`docs/architecture/solution-design-fase4.md`](../architecture/solution-design-fase4.md) |

Use o diagrama Mermaid “Diagrama Geral” no PDF do portal.  
PNG pronto: [`docs/delivery/assets/diagrama-geral-fase4.png`](./assets/diagrama-geral-fase4.png).  
Documento PDF canônico: [`portal-entrega-fase4.md`](./portal-entrega-fase4.md).

## Dockerfile por microsserviço

| Serviço | Dockerfile | Runtime |
|---|---|---|
| OS Service | `autoservicemanager-app/Dockerfile` | Node 22 multi-stage + Prisma |
| Billing | `autoservicemanager-billing/Dockerfile` | Node 22 Alpine, user 10001 |
| Execution | `autoservicemanager-execution/Dockerfile` | Node 22 Alpine, user 10001 |

Build local:

```bash
docker build -t autoservicemanager-app ./autoservicemanager-app
docker build -t autoservicemanager-billing ./autoservicemanager-billing
docker build -t autoservicemanager-execution ./autoservicemanager-execution
```

## Manifestos Kubernetes

| Serviço | Manifesto | Conteúdo |
|---|---|---|
| OS | `autoservicemanager-app/k8s/` | Namespace, ConfigMap, SA/IRSA, Deployment, Service, HPA, Job migrate, X-Ray |
| Billing | `autoservicemanager-billing/k8s/billing.yaml` | SA/IRSA, ConfigMap, Deployment, Service, HPA, PDB |
| Execution | `autoservicemanager-execution/k8s/execution.yaml` | SA/IRSA, ConfigMap, Deployment, Service, HPA, PDB |

Placeholders a substituir no apply/CD: `ACCOUNT_ID`, `ENV`, imagem `github.sha`.

```bash
kubectl apply -f autoservicemanager-billing/k8s/billing.yaml
kubectl apply -f autoservicemanager-execution/k8s/execution.yaml
kubectl apply -f autoservicemanager-app/k8s/
```

## Evidência de cobertura

| Artefato | Caminho |
|---|---|
| Relatório consolidado | [`docs/qa/coverage-evidence-fase4.md`](../qa/coverage-evidence-fase4.md) |
| LCOV / HTML / json-summary | [`docs/qa/coverage-artifacts/`](../qa/coverage-artifacts/) |
| BDD | `features/ciclo-os-saga.feature` + `yarn test:phase4` |

Gate do enunciado: **≥80%**. Gate interno do projeto: **≥90%** (statements/branches/functions/lines).

## Collections Postman

| Collection | Uso |
|---|---|
| [`docs/postman/autoservicemanager.postman_collection.json`](../postman/autoservicemanager.postman_collection.json) | API OS completa (local/kind) |
| [`docs/postman/autoservicemanager-aws.postman_collection.json`](../postman/autoservicemanager-aws.postman_collection.json) | Homolog AWS + seção Fase 4 |
| [`docs/postman/autoservicemanager-fase4.postman_collection.json`](../postman/autoservicemanager-fase4.postman_collection.json) | Saga, Billing, Execution, webhook MP |
| Guia | [`docs/postman/README-fase4.md`](../postman/README-fase4.md) |

Swagger: OS `/api-docs`, Billing `/docs`, Execution `/docs` (quando `SWAGGER_ENABLED=true`).
