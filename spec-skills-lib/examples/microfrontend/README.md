# Example: Microfrontend

Exemplo de adocao para arquitetura microfrontend com shell e apps federados.

## Contexto
- Arquitetura: microfrontend
- Stack: React + Module Federation + BFF opcional
- Nivel: MVP

## Como usar
1. Copie `global-rules.override.yaml` para o baseline de regras.
2. Divida boundaries por `rootconfig`, `shell` e `remote-apps`.
3. Execute `bash tools/validate-local.sh`.

## Observabilidade (papel obrigatorio)
- Crie sinais por app remoto e por shell.
- Configure alertas de falha de carga de remote e erros de navegacao.
- Vincule incidentes ao `rootconfig` e ao remote impactado.
