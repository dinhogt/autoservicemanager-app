import { Veiculo } from '../entities/veiculo.entity';

export const VEICULO_REPOSITORY = Symbol('VEICULO_REPOSITORY');

export interface ListarVeiculosFilter {
  clienteId?: string;
  incluirInativos?: boolean;
}

export interface VeiculoRepository {
  create(data: {
    clienteId: string;
    placa: string;
    marca?: string | null;
    modelo?: string | null;
    ano?: number | null;
  }): Promise<Veiculo>;
  update(
    id: string,
    data: Partial<{
      marca: string | null;
      modelo: string | null;
      ano: number | null;
      ativo: boolean;
    }>,
  ): Promise<Veiculo>;
  softDelete(id: string): Promise<void>;
  findById(id: string): Promise<Veiculo | null>;
  findByPlaca(placaNormalized: string): Promise<Veiculo | null>;
  findByClienteId(
    clienteId: string,
    filter?: { incluirInativos?: boolean },
  ): Promise<Veiculo[]>;
  findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarVeiculosFilter,
  ): Promise<Veiculo[]>;
  count(filter?: ListarVeiculosFilter): Promise<number>;
}
