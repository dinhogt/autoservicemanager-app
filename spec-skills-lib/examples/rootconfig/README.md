# Example: RootConfig

Exemplo de adocao para `rootconfig` em plataformas de microfrontends.

## Contexto
- Arquitetura: rootconfig + remotes
- Stack: React + Node.js
- Nivel: MVP

## Como usar
1. Aplique `global-rules.override.yaml`.
2. Trate `rootconfig` como boundary independente no fluxo.
3. Mantenha documentacao de rotas e lifecycle dos remotes.

## Observabilidade (papel obrigatorio)
- Dashboards para health do `rootconfig` e tempo de bootstrap.
- Alertas para falhas de registro/carregamento de remotes.
- Logs estruturados para roteamento e lifecycle events.
