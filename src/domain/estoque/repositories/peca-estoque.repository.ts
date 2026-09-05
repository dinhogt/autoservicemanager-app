import { PecaEstoque } from '../entities/peca-estoque.entity';

export const PECA_ESTOQUE_REPOSITORY = Symbol('PECA_ESTOQUE_REPOSITORY');

export interface ListarPecasFilter {
  incluirInativos?: boolean;
}

export interface PecaEstoqueRepository {
  create(data: {
    descricao: string;
    precoUnitario: number;
    quantidadeEmEstoque: number;
    codigoInterno: string;
  }): Promise<PecaEstoque>;
  update(
    id: string,
    data: Partial<{
      descricao: string;
      precoUnitario: number;
      ativo: boolean;
    }>,
  ): Promise<PecaEstoque>;
  softDelete(id: string): Promise<void>;
  findById(id: string): Promise<PecaEstoque | null>;
  findActiveByIds(ids: string[]): Promise<PecaEstoque[]>;
  findByCodigoInterno(codigo: string): Promise<PecaEstoque | null>;
  findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarPecasFilter,
  ): Promise<PecaEstoque[]>;
  count(filter?: ListarPecasFilter): Promise<number>;
  aplicarMovimentacao(id: string, delta: number): Promise<PecaEstoque>;
}
