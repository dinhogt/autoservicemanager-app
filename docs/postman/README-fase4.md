# Collections Postman — Fase 4

## Arquivos

| Arquivo | Quando usar |
|---|---|
| [`autoservicemanager-fase4.postman_collection.json`](./autoservicemanager-fase4.postman_collection.json) | **Principal da demo Fase 4** — Saga, Billing, Execution, webhook MP |
| [`autoservicemanager-aws.postman_collection.json`](./autoservicemanager-aws.postman_collection.json) | Homolog AWS (APIGW) + pasta `4. Fase 4` |
| [`autoservicemanager.postman_collection.json`](./autoservicemanager.postman_collection.json) | API OS completa local + atalho Fase 4 |
| [`README-aws.md`](./README-aws.md) | Guia detalhado da collection AWS (Fase 3+) |

## Importar

Postman: **Import** → selecionar o JSON.  
Insomnia: Import Data → From File.

## Variáveis da collection Fase 4

| Variável | Local (`docker-compose.phase4.yml`) | AWS |
|---|---|---|
| `baseUrlOs` | `http://localhost:3000` | APIGW ou port-forward OS |
| `baseUrlBilling` | porta do serviço billing no compose | `{{baseUrl}}/billing` |
| `baseUrlExecution` | porta do execution no compose | port-forward `svc/execution` |
| `saga_secret` | `phase4-local-secret` | valor do Secret K8s |
| `os_id` / `correlation_id` / `billing_id` | preenchidos pelos scripts de teste | idem |

Confira as portas reais em `docker-compose.phase4.yml` se diferirem de 3000/3001/3002.

## Sequência sugerida (gravação / validação)

1. **0. Health** — OS, Billing live/ready, Execution.
2. **4. Fluxo OS** — Criar OS (captura `os_id` / `correlation_id` se `SAGA_AUTO_START`).
3. **2. Saga** — Consultar Saga; acompanhar status.
4. **3. Billing** — Criar orçamento → payment → webhook → (opcional) refund.
5. **2. Saga** — Injetar `EXECUCAO_FALHOU` (demo compensação) → consultar Saga `COMPENSATED`.

Alternativa AWS: rode a collection AWS pastas 1–2 e depois a pasta **4. Fase 4**.

## Swagger

| Serviço | URL |
|---|---|
| OS | `GET /api-docs` |
| Billing | `GET /docs` |
| Execution | `GET /docs` (`SWAGGER_ENABLED=true`) |
