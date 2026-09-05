import { Cliente } from '../entities/cliente.entity';

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');

export interface ListarClientesFilter {
  incluirInativos?: boolean;
}

export interface ClienteRepository {
  create(data: {
    nome: string;
    cpfCnpj: string;
    contato?: string | null;
    enderecos?: string | null;
  }): Promise<Cliente>;
  update(
    id: string,
    data: Partial<{
      nome: string;
      contato: string | null;
      enderecos: string | null;
      ativo: boolean;
    }>,
  ): Promise<Cliente>;
  softDelete(id: string): Promise<void>;
  findById(id: string): Promise<Cliente | null>;
  findByCpfCnpj(cpfCnpjDigits: string): Promise<Cliente | null>;
  findAll(
    pagination?: { skip: number; take: number },
    filter?: ListarClientesFilter,
  ): Promise<Cliente[]>;
  count(filter?: ListarClientesFilter): Promise<number>;
}
