# Exemplo: Go microservice

- Stack: `go-http-service`
- Fluxo: `complex-flow` (multi-serviço)
- Inclui estágio `infrastructure` após security

## Override

Copie `global-rules.override.yaml` para `spec-skills-lib/rules/global-rules.override.yaml`.

## Comandos típicos

```bash
go test ./...
golangci-lint run
govulncheck ./...
```
