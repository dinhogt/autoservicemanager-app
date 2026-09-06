# Entrega Portal do Aluno — Tech Challenge Fase 3

| Campo | Valor |
|-------|-------|
| Data | 2026-09-06 |
| Índice canônico | [../architecture/delivery-index.md](../architecture/delivery-index.md) |

## 1. Links dos 4 repositórios

1. https://github.com/dinhogt/autoservicemanager-app  
2. https://github.com/dinhogt/autoservicemanager-auth-lambda  
3. https://github.com/dinhogt/autoservicemanager-infra-db  
4. https://github.com/dinhogt/autoservicemanager-infra-k8s  

Monorepo legado (não entregar como principal): https://github.com/dinhogt/autoServiceManager  

## 2. Documentação

| Item | Link |
|------|------|
| Índice | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/architecture/delivery-index.md |
| Solution design | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/architecture/solution-design-fase3.md |
| Diagramas | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/architecture/diagrams-fase3.md |
| ER | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/architecture/er-diagram.md |
| ADR-011 | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/architecture/adr-011-sync-rest-api-gateway.md |
| Bootstrap AWS (sem apply) | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/infrastructure/aws-bootstrap-no-apply.md |
| QA | https://github.com/dinhogt/autoservicemanager-app/blob/develop/docs/qa/validation-report.md |

## 3. Vídeo (≤15 min)

Roteiro: [video-script.md](./video-script.md)  
URL YouTube/Vimeo: **_preencher após gravação (requer apply + smoke para demo live)_**

## 4. Colaborador `soat-architecture`

| Repo | Convite Read |
|------|----------------|
| app | Enviado — **pending accept** (id 331871608) |
| auth-lambda | Enviado — pending |
| infra-db | Enviado — pending |
| infra-k8s | Enviado — pending |

Confirmação no PDF: “Convites Read enviados aos 4 repositórios; aceite do usuário `soat-architecture` pendente na data da geração deste documento.”

## 5. Como gerar o PDF

1. Abrir este arquivo + [delivery-index.md](../architecture/delivery-index.md) no GitHub (Print → Save as PDF), **ou**  
2. `npx --yes md-to-pdf docs/delivery/portal-entrega.md` (na raiz do app).

Arquivo gerado: [`portal-entrega.pdf`](./portal-entrega.pdf) (regenerar com `PUPPETEER_EXECUTABLE_PATH=... npx md-to-pdf docs/delivery/portal-entrega.md`).
