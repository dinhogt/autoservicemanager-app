# `@dinhogt/domain-shared`

Validações puras (sem Nest/Prisma) de **CPF**, **CNPJ** e **placa** (padrão antigo + Mercosul).

Consumido pelo app NestJS (workspace) e pela Lambda `authCpf` via **GitHub Packages** — evita drift da regra de dígito verificador entre repositórios.

> Publicado como `@dinhogt/domain-shared` (GitHub Packages exige escopo = owner). Plano FIAP citava `@autoservicemanager/domain-shared`.

## API

```ts
import {
  onlyDigits,
  isValidCpf,
  isValidCnpj,
  isValidCpfCnpj,
  normalizePlaca,
  isValidPlaca,
} from '@dinhogt/domain-shared';
```

| Função | Descrição |
|--------|-----------|
| `onlyDigits` | Remove não-dígitos |
| `isValidCpf` | CPF 11 dígitos + DV |
| `isValidCnpj` | CNPJ 14 dígitos + DV |
| `isValidCpfCnpj` | CPF ou CNPJ |
| `normalizePlaca` | Uppercase, sem espaços/hífen |
| `isValidPlaca` | Antigo `LLLNNNN` ou Mercosul `LLLNLNN` |

## Desenvolvimento local (workspace no app)

```bash
yarn install
yarn workspace @dinhogt/domain-shared build
yarn workspace @dinhogt/domain-shared test
```

## Publicação (GitHub Packages)

```bash
# Tag (preferido — CI)
git tag domain-shared-v0.1.0
git push origin domain-shared-v0.1.0

# Ou workflow_dispatch em .github/workflows/publish-domain-shared.yml
```

Consumo no auth-lambda: ver README desse repo (`.npmrc` + `NODE_AUTH_TOKEN`).

## Versionamento

Semver. Bump em `packages/domain-shared/package.json` antes da tag.
