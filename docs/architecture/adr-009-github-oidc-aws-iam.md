# ADR-009 — CI/CD com GitHub OIDC → AWS IAM Role

| Campo | Valor |
|-------|-------|
| Status | Aceito — Fase 3 |
| Data | 2026-08-07 |
| Role | architecture |
| Relacionados | ADR-008 (state/apply), security-playbook (no long-lived secrets) |

## Contexto

Os quatro repositórios da Fase 3 precisam de deploy automático (homolog/master) para AWS (ECR, EKS, Lambda, Terraform). Credenciais estáticas (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) no GitHub Secrets aumentam superfície de vazamento e contradizem `.agents/rules/security-guardrails.md` e o security-playbook.

## Decisão

1. Configurar **OIDC Identity Provider** na conta AWS para `token.actions.githubusercontent.com`.
2. Criar **IAM Roles** com trust policy restrita por:
   - `repo:<org>/autoservicemanager-app:*` (e equivalentes nos outros 3 repos)
   - branch / environment (`homolog`, `master`) quando possível via `sub` claim.
3. Pipelines usam `aws-actions/configure-aws-credentials` com `role-to-assume` — **sem** access keys de longo prazo.
4. Permissões mínimas por role (exemplos):
   - **app:** ECR push, `eks:DescribeCluster`, assume para `kubectl` via IRSA mapping / aws-auth.
   - **auth-lambda:** `lambda:UpdateFunctionCode`, leitura Secrets (deploy time via Terraform preferencialmente).
   - **infra-db / infra-k8s:** permissões Terraform necessárias + state S3/DynamoDB.
5. Branch `master` protegida; merge só via PR; deploy automático em `homolog` e `master`.

### Trade-offs

| Opção | Prós | Contras | Escolha |
|-------|------|---------|---------|
| Access keys em GitHub Secrets | Rápido | Segredo estático; rotação manual | Rejeitada |
| OIDC → IAM Role | Sem segredo de longo prazo; auditável | Setup IAM inicial | **Aceita** |
| Self-hosted runner com instance profile | Sem OIDC | Ops de runner; overkill acadêmico | Rejeitada |

## Consequências

- Todo repo precisa do mesmo padrão de workflow (documento no README).
- Usuário `soat-architecture` recebe acesso de colaborador; não recebe keys AWS.
- Falha de trust (`sub` mismatch) é o erro mais comum — testar em PR de homolog primeiro.

## Fora de escopo

- Federation para outros clouds.
- OIDC para desenvolvedores locais (usam perfis AWS pessoais / LocalStack).
