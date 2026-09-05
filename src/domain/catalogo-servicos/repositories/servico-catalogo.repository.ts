import { ServicoCatalogo } from '../entities/servico-catalogo.entity';

export const SERVICO_CATALOGO_REPOSITORY = Symbol(
  'SERVICO_CATALOGO_REPOSITORY',
);

export interface ListarServicosFilter {
  incluirInativos?: boolean;
}

export interface ServicoCatalogoRepository {
  create(data: {
    descricao: string;
    precoBase: number;
    tempoMedioExecucao: number;
  }): Promise<ServicoCatalogo>;
  update(
    id: string,
    data: Partial<{
      descricao: string;
      precoBase: number;
      tempoMedioExecucao: number;
      ativo: boolean;
    }>,
  ): Promise<ServicoCatalogo>;
  softDelete(id: string): Promise<void>;
  findById(id: string): Promise<ServicoCatalogo | null>;
  findActiveByIds(ids: string[]): Promise<ServicoCatalogo[]>;
  findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarServicosFilter,
  ): Promise<ServicoCatalogo[]>;
  count(filter?: ListarServicosFilter): Promise<number>;
}
