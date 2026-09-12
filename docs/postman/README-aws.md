# Collection AWS — Guia de uso

Arquivo: [`autoservicemanager-aws.postman_collection.json`](autoservicemanager-aws.postman_collection.json)

## Como importar

### Postman
1. **Import** → arrastar o `.json`
2. A collection já vem com todas as variáveis pré-preenchidas

### Insomnia
1. **Application menu → Import Data → From File** → selecionar o `.json`
2. Insomnia converte automaticamente

## Setup inicial (uma vez)

1. **Verificar variáveis** da collection (aba `Variables`):
   - `baseUrl` = `https://tiib2w2kb6.execute-api.us-east-1.amazonaws.com` (APIGW público)
   - `baseUrlAdmin` = `http://localhost:3000` (port-forward — só se for usar admin)
   - `cpf` = `52998224725` (Roberto Almeida — seed)

2. **Rodar `1.2 Auth CPF`** primeiro — salva `{{jwt_token}}` automaticamente

3. Todas as demais requests da seção `1. AWS — Público` reaproveitam esse token

## Estrutura da collection

### 📁 1. AWS — Público via APIGW (10 requests)

Tudo que está exposto pelo API Gateway. Rode nesta ordem:

| # | Nome | O que valida |
|---|------|--------------|
| 1.1 | Health check | APIGW → NLB → EKS → pod NestJS |
| 1.2 | Auth CPF | Lambda → Secrets Manager → RDS → JWT RS256 |
| 1.3 | Sem token → 401 | JWT Authorizer bloqueando |
| 1.4 | Status OS (autenticado) | JWT válido chega no app |
| 1.5 | Criar OS | Persiste no RDS |
| 1.6 | Aprovar orçamento | Transição de estado |
| 1.7 | Rejeitar orçamento | Fluxo alternativo |
| 1.8 | JWT cliente em /admin → 401 | Separação de scopes |
| 1.9 | Webhook HMAC | Integração externa autenticada |
| 1.10 | Root não mapeada → 404 | Superfície mínima |

### 📁 2. AWS — Admin (port-forward) (9 requests)

Fluxos internos da oficina (não expostos publicamente).

**Antes de rodar**, abra outro terminal:
```bash
export AWS_PROFILE=asm-bootstrap
kubectl port-forward -n autoservice svc/autoservice-api 3000:80
```

Deixe rodando. As requests batem em `http://localhost:3000` = pod dentro do EKS via túnel.

Rode `2.1 Login admin` primeiro (salva `{{admin_token}}`), depois as outras.

**Requisito de dados**: os admins não estão no RDS (o seed que rodamos só criou clientes). Para usar essa seção, você precisa:
- **Opção A**: rodar `yarn db:seed` completo do app (cria admins com senha `Senha@1234`)
- **Opção B**: inserir um admin manualmente via `kubectl exec` num pod

### 📁 3. CRUDs Admin (port-forward) (11 requests)

CRUDs completos: clientes, veículos, peças, serviços, usuários. Mesma configuração da seção 2.

## Webhook secret (seção 1.9)

Descubra o secret real com:

```bash
export AWS_PROFILE=asm-bootstrap
kubectl get secret autoservice-secrets -n autoservice \
  -o jsonpath='{.data.WEBHOOK_SECRET}' | base64 -d
```

Cole o valor em `Variables → webhook_secret` da collection.

## Diferenças vs. collection original

| Aspecto | Original | AWS |
|---------|----------|-----|
| baseUrl | localhost:3000 | APIGW real |
| Auth | Só `POST /auth/login` (HS256) | `POST /auth/cpf` (RS256) + admin via port-forward |
| Rotas expostas | Todas em localhost | Só cliente/webhook via APIGW |
| Testes de segurança | Nenhum | 3 casos (401 sem token, 401 scope errado, 404 rota inexistente) |
| Scripts pós-request | Login salva token | Auth CPF e Login salvam tokens separados; Criar OS salva OS ID |

## Sequência recomendada para demonstração ao vivo

**Cenário: cliente abre OS, acompanha status, aprova orçamento.**

1. `1.1 Health check` → prova infra
2. `1.10 Root → 404` → prova superfície mínima
3. `1.3 Sem token → 401` → prova segurança
4. `1.2 Auth CPF` → mostra Lambda + JWT
5. Abrir Console AWS → CloudWatch Logs → mostrar Lambda invocada
6. `1.5 Criar OS` → prova persistência no RDS
7. `1.4 Status OS` → mostra state machine funcionando
8. `1.8 Rota admin com token cliente → 401` → separação de scopes
9. `1.9 Webhook` → integração externa

Depois, se quiser mostrar admin:
10. Rodar `kubectl port-forward` em outro terminal
11. `2.1 Login admin`
12. `2.7 Gerar orçamento` (para a OS criada em 1.5)
13. Voltar em `1.6 Aprovar orçamento` → cliente aprova
14. `2.6 Iniciar diagnóstico` → `2.8 Finalizar` → `2.9 Entregar`
