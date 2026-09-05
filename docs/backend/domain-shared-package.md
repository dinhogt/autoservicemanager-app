# Pacote compartilhado — contrato app ↔ Lambda

| Campo | Valor |
|-------|-------|
| Pacote | `@dinhogt/domain-shared` `0.1.0` |
| Local | `packages/domain-shared/` |
| Publish | `.github/workflows/publish-domain-shared.yml` (tag `domain-shared-v*`) |
| Registry | GitHub Packages (`https://npm.pkg.github.com`) |
| ADR | solution-design-fase3 / risco R3 |

> Escopo npm = owner GitHub (`@dinhogt`). O plano FIAP citava `@autoservicemanager/domain-shared` como nome lógico.

## Consumo

- **App:** workspace Yarn; `src/shared/utils/cpf-cnpj.util.ts` e `placa.util.ts` reexportam o pacote.
- **Lambda:** repo [autoservicemanager-auth-lambda](https://github.com/dinhogt/autoservicemanager-auth-lambda) — `import { onlyDigits, isValidCpfCnpj } from '@dinhogt/domain-shared'` com auth Packages (`NODE_AUTH_TOKEN` / `GITHUB_TOKEN`).

## Fluxo publish → consume

1. Bump versão em `packages/domain-shared/package.json`
2. Tag `domain-shared-v0.1.0` neste repo (app) → workflow publica
3. No auth-lambda: `"@dinhogt/domain-shared": "0.1.0"` + `.npmrc` apontando `@dinhogt` para `npm.pkg.github.com`

## Comandos (app)

```bash
yarn domain-shared:build
yarn domain-shared:test
```
