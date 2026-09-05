# Diagrama ER — MySQL (Prisma)

| Campo | Valor |
|-------|-------|
| Todo | `docs-arch` |
| Data | 2026-08-09 |
| Fonte | [`prisma/schema.prisma`](../../prisma/schema.prisma) |
| Nota | Sem coleções Mongo (ADR-010) |

```mermaid
erDiagram
  Cliente ||--o{ Veiculo : possui
  Cliente ||--o{ OrdemServico : solicita
  Veiculo ||--o{ OrdemServico : referencia
  OrdemServico ||--o{ ItemServicoOs : contem
  OrdemServico ||--o{ ItemPecaOs : contem
  ServicoCatalogo ||--o{ ItemServicoOs : cataloga
  PecaEstoque ||--o{ ItemPecaOs : reserva

  Cliente {
    string id PK
    string nome
    string cpfCnpj UK
    string contato
    string enderecos
    boolean ativo
  }

  Veiculo {
    string id PK
    string clienteId FK
    string placa UK
    string marca
    string modelo
    int ano
    boolean ativo
  }

  ServicoCatalogo {
    string id PK
    string descricao
    decimal precoBase
    int tempoMedioExecucao
    boolean ativo
  }

  PecaEstoque {
    string id PK
    string descricao
    decimal precoUnitario
    int quantidadeEmEstoque
    string codigoInterno UK
    boolean ativo
  }

  OrdemServico {
    string id PK
    string clienteId FK
    string veiculoId FK
    enum status
    decimal total
    datetime dataCriacao
    datetime dataConclusao
    datetime dataEntrega
  }

  ItemServicoOs {
    string id PK
    string ordemServicoId FK
    string servicoCatalogoId FK
    int quantidade
    decimal precoAplicado
  }

  ItemPecaOs {
    string id PK
    string ordemServicoId FK
    string pecaEstoqueId FK
    int quantidade
    decimal precoUnitario
    boolean reservado
    boolean baixado
  }

  UsuarioAdmin {
    string id PK
    string nome
    string email UK
    string senhaHash
    enum role
    boolean ativo
  }
```

## Enums

| Enum | Valores |
|------|---------|
| `StatusOs` | RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, FINALIZADA, ENTREGUE, REJEITADA |
| `RoleAdmin` | ADMIN, GERENTE, MECANICO, ATENDENTE |

`UsuarioAdmin` não tem FK para OS (auth admin desacoplada do domínio de atendimento).
