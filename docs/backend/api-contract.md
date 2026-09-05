# API Contract — Atendimento (Fase 3)

Base URL: `/` (porta 3000). Documentação interativa: `/api-docs`.

## Ordens de serviço (cliente)

Auth cliente (ADR-007): headers `x-cpf` (+ opcional `x-scope: cliente`) injetados pelo JWT Authorizer do API Gateway. O Nest **não** revalida RS256.

### POST `/ordens-servico`

Público. Cria OS (status `RECEBIDA`). Retorna agregado com `id` UUID.

### GET `/ordens-servico/:id/status`

Headers: `x-cpf` (obrigatório). Consulta status; CPF deve bater com o cliente da OS. Sem header/invalid → **403**.

### POST `/ordens-servico/:id/aprovacoes`

Headers: `x-cpf`. Body: `{ "aprovado": true | false }`. Transição para `EM_EXECUCAO` ou `REJEITADA`.

## Listagem admin

### GET `/admin/ordens-servico?page=1&limit=20`

JWT + RBAC. **Comportamento Fase 2:**

- Exclui `FINALIZADA` e `ENTREGUE`
- Ordenação: execução → aguardando aprovação → diagnóstico → recebida → demais; mais antigas primeiro

## Webhook

### POST `/webhooks/os/:id/status`

Header obrigatório: `X-Webhook-Secret: <WEBHOOK_SECRET>`

Body:

```json
{ "status": "EM_DIAGNOSTICO" }
```

Transições permitidas:

| De | Para |
|----|------|
| RECEBIDA | EM_DIAGNOSTICO |
| EM_DIAGNOSTICO | AGUARDANDO_APROVACAO |
| AGUARDANDO_APROVACAO | EM_EXECUCAO, REJEITADA |
| EM_EXECUCAO | FINALIZADA |
| FINALIZADA | ENTREGUE |

Erros: `401` secret inválido; `404` OS não encontrada; `409` transição inválida.

## E-mail (Mailtrap / SMTP)

Notificações **best-effort** (falha SMTP não reverte transação de negócio).

### Quando dispara

| Evento | Canal |
|--------|-------|
| Mudança de status da OS | `CompositeOsStatusNotifier` (log + e-mail) |
| Orçamento gerado | `CompositeOrcamentoNotifier` (log + e-mail) |

### Configuração (demo local com Mailtrap)

Copie `.env.example` para `.env` e preencha com credenciais do inbox Mailtrap:

```bash
EMAIL_ENABLED=true
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=seu_user_mailtrap
SMTP_PASS=sua_senha_mailtrap
EMAIL_FROM=noreply@autoservice.local
WEBHOOK_SECRET=docker-compose-dev-webhook-secret-min-16
```

Com Docker Compose: `docker compose --env-file .env up --build`

O campo `contato` do cliente deve conter e-mail válido (`@`). O seed usa `*@demo.autoservice.local`.

Variáveis: `EMAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

## Códigos de erro comuns

| Código | Situação |
|--------|----------|
| 400 | Payload/query inválido |
| 401 | JWT ou webhook secret ausente/inválido |
| 403 | Role insuficiente |
| 404 | Recurso não encontrado |
| 409 | Conflito de status / transição |
| 422 | CPF/placa inválido |
