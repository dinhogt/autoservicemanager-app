# Pacote compartilhado — contrato app ↔ Lambda

| Campo | Valor |
|-------|-------|
| Pacote | `@autoservicemanager/domain-shared` `0.1.0` |
| Local | `packages/domain-shared/` |
| Publish | `.github/workflows/publish-domain-shared.yml` (tag `domain-shared-v*`) |
| ADR | solution-design-fase3 / risco R3 |

## Consumo

- **App:** `src/shared/utils/cpf-cnpj.util.ts` e `placa.util.ts` reexportam o pacote; VOs de domínio permanecem no app.
- **Lambda (Fase 3):** pasta [`auth-lambda/`](../../auth-lambda/) — `import { onlyDigits, isValidCpfCnpj } from '@autoservicemanager/domain-shared'` (ver [auth-lambda.md](./auth-lambda.md)).

## Comandos

```bash
yarn domain-shared:build
yarn domain-shared:test
```
