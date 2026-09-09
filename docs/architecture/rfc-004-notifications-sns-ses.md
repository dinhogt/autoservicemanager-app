# RFC-004 — Notificações serverless (SNS + Lambda + SES)

| Campo | Valor |
|-------|-------|
| Status | Aceito |
| Data | 2026-09-08 |
| Role | architecture / backend |
| Relacionados | ADR-002 (e-mail Fase 2), ADR-011, ADR-012 |

## Problema

A rubrica Fase 3 exige soluções **serverless** para autenticação **e notificações**. O MVP Fase 2 enviava e-mail via SMTP in-process no pod Nest — acopla latência da API ao provedor e não é serverless.

## Proposta

1. Tópico SNS `os-notifications` (Terraform `infra-k8s`).
2. Lambda `notify-os` (mesmo repo `auth-lambda`) inscrita no tópico; envia SES; log JSON `event=os_notification`.
3. App publica payload via `SnsOsStatusNotifier` / `SnsOrcamentoNotifier` (IRSA `sns:Publish`).
4. SMTP permanece **fallback local** quando `OS_NOTIFICATIONS_TOPIC_ARN` está vazio.

## Alternativas rejeitadas

| Opção | Motivo |
|-------|--------|
| SES direto do pod | Ainda acopla API ao e-mail; sem fila |
| 5º repositório só para notify | Excede o limite de 4 repos da rubrica |
| Manter só SMTP | Não atende “serverless para notificações” |

## Decisão

Aceitar SNS → Lambda → SES no stack k8s + código no repo Lambda.

## Critérios de aceite

- [x] Terraform SNS + Lambda + IAM + subscription
- [x] Handler notify-os + zip no CI auth-lambda
- [x] Composite do app usa SNS quando topic ARN presente
