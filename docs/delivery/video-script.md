# Roteiro de vídeo — Tech Challenge Fase 3 (≤15 min)

| Campo | Valor |
|-------|-------|
| Duração alvo | 12–14 min |
| Pré-requisito live | `terraform apply` homolog + CD app/lambda (ainda **não** liberado nesta entrega parcial) |

## Roteiro

| Min | Cena | Falar / mostrar |
|-----|------|-----------------|
| 0:00–1:00 | Abertura | 4 repos no GitHub; pasta local `autoservicemanager-repos`; delivery-index |
| 1:00–3:00 | Auth CPF | `POST /auth/cpf` no APIGW → JWT; mostrar claim / Bearer |
| 3:00–5:00 | API protegida | `POST /ordens-servico` + GET status com Bearer; header correlação |
| 5:00–8:00 | CI/CD | Actions: PR checks `security-gate`+`ci`; push develop → deploy (homolog) |
| 8:00–11:00 | Observabilidade | CloudWatch dashboard volume OS / latência; alarme; logs JSON; X-Ray |
| 11:00–13:00 | Infra | Terraform repos db→k8s; mencionar OIDC sem AKIA |
| 13:00–15:00 | Encerramento | Links docs ADRs/RFCs/ER; `soat-architecture`; destroy pós-demo se aplicável |

## Fallback se apply ainda não liberado

Gravar **walkthrough de código + GitHub Actions CI (validate)** + diagramas Mermaid no GitHub + este roteiro como “pré-demo”; regravar minutos 1–11 após smoke live.

## Checklist pós-gravação

- [ ] Upload YouTube/Vimeo (público ou não listado)  
- [ ] Colar URL em [portal-entrega.md](./portal-entrega.md) e [delivery-index.md](../architecture/delivery-index.md)  
- [ ] PDF Portal atualizado  
