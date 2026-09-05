# ADR-002 — Fase 2: AWS, e-mail e webhook

## Status

Aceito — Fase 2 Tech Challenge

## Contexto

A Fase 2 exige escalabilidade, CI/CD, Kubernetes, Terraform, notificações por e-mail e APIs de OS conforme especificação FIAP.

## Decisões

### 1. Infraestrutura AWS (EKS + RDS)

- **EKS** para orquestração e HPA (demonstração de escalabilidade).
- **RDS MySQL 8** como fonte da verdade (ACID, Prisma Migrate).
- **ECR + Secrets Manager** para imagens e segredos.
- NAT gateway único em dev para reduzir custo acadêmico.

### 2. Listagem de OS

Prioridade de exibição via `ORDER BY CASE` no repositório Prisma:

`EM_EXECUCAO` > `AGUARDANDO_APROVACAO` > `EM_DIAGNOSTICO` > `RECEBIDA` > demais; `dataCriacao ASC`; excluir `FINALIZADA` e `ENTREGUE` da query (não é soft-delete).

`REJEITADA` aparece após as quatro prioridades do PDF (prioridade 5).

### 3. E-mail outbound

- Porta `OsStatusNotifierPort` + adaptador SMTP (Nodemailer / Amazon SES).
- `CompositeOsStatusNotifier`: log sempre + e-mail quando `EMAIL_ENABLED=true`.
- Destinatário: campo `contato` do cliente se contiver `@`.

### 4. Webhook inbound

- `POST /webhooks/os/:id/status` com header `X-Webhook-Secret`.
- Transições validadas por `OrderStatusService.assertTransicaoWebhookPermitida`.
- Secret em K8s Secret / Secrets Manager — nunca no repositório.

### 5. Clean Architecture (atendimento)

- `OrdemServicoRepository` expandido e registrado via DI.
- Use cases de OS dependem do repositório, não de `PrismaService` direto (exceto validações de catálogo/cadastro em `CriarOrdemServicoUseCase`).

### 6. MongoDB

Auditoria permanece best-effort. Em produção AWS: MongoDB Atlas free tier ou StatefulSet no cluster — trade-off operacional documentado no runbook.

### 7. codeAgentSpecs

Pasta local de specs do agente; **ignorada no `.gitignore`** — não faz parte da entrega ao `soat-architecture`.

## Consequências

- Custo AWS contínuo se ambiente não for destruído após demo.
- SES pode exigir verificação de domínio; Mailtrap aceitável para vídeo com toggle de e-mail.
- Webhook de aprovação com reserva de estoque reutiliza lógica transacional do repositório.
