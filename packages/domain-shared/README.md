# `@autoservicemanager/domain-shared`

Validações puras (sem Nest/Prisma) de **CPF**, **CNPJ** e **placa** (padrão antigo + Mercosul).

Consumido pelo app NestJS e, na Fase 3, pela Lambda `authCpf` — evita drift da regra de dígito verificador entre repositórios (ver ADR / solution-design Fase 3).

## API

```ts
import {
  onlyDigits,
  isValidCpf,
  isValidCnpj,
  isValidCpfCnpj,
  normalizePlaca,
  isValidPlaca,
} from '@autoservicemanager/domain-shared';
```

| Função | Descrição |
|--------|-----------|
| `onlyDigits` | Remove não-dígitos |
| `isValidCpf` | CPF 11 dígitos + DV |
| `isValidCnpj` | CNPJ 14 dígitos + DV |
| `isValidCpfCnpj` | CPF ou CNPJ |
| `normalizePlaca` | Uppercase, sem espaços/hífen |
| `isValidPlaca` | Antigo `LLLNNNN` ou Mercosul `LLLNLNN` |

## Desenvolvimento local (workspace)

Na raiz do monorepo:

```bash
yarn install
yarn workspace @autoservicemanager/domain-shared build
yarn workspace @autoservicemanager/domain-shared test
```

O app depende do workspace via Yarn; utilitários em `src/shared/utils/*` reexportam este pacote.

## Publicação (GitHub Packages)

Escopo npm `@autoservicemanager` exige organização GitHub **homônima** (ou ajuste do `name` no `package.json` para `@<owner>/…`).

```bash
# token com write:packages
echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> ~/.npmrc
echo "@autoservicemanager:registry=https://npm.pkg.github.com" >> ~/.npmrc
yarn workspace @autoservicemanager/domain-shared publish
```

Workflow: [`.github/workflows/publish-domain-shared.yml`](../../.github/workflows/publish-domain-shared.yml) — dispara em tag `domain-shared-v*`.

## Versionamento

Semver. Bump em `packages/domain-shared/package.json` antes da tag.
