import { StatusOs } from '../value-objects/status-os.enum';
import { OrdemServico } from '../entities/ordem-servico.entity';
import {
  OrdemServicoComClienteVeiculo,
  OrdemServicoPainelItem,
} from '../types/ordem-servico-read.types';

export const ORDEM_SERVICO_REPOSITORY = Symbol('ORDEM_SERVICO_REPOSITORY');

export interface CreateOrdemServicoInput {
  clienteId: string;
  veiculoId: string;
  total: number;
  itensServico: {
    servicoCatalogoId: string;
    quantidade: number;
    precoAplicado: number;
  }[];
  itensPeca: {
    pecaEstoqueId: string;
    quantidade: number;
    precoUnitario: number;
  }[];
}

export interface UpdateOrdemServicoStatusInput {
  status: StatusOs;
  total?: number;
  dataConclusao?: Date | null;
  dataEntrega?: Date | null;
}

export interface OrdemServicoRepository {
  findById(id: string): Promise<OrdemServico | null>;
  findWithClienteVeiculoById(
    id: string,
  ): Promise<OrdemServicoComClienteVeiculo | null>;
  findDetailedById(id: string): Promise<Record<string, unknown> | null>;
  listarAtivasParaPainel(params: {
    skip: number;
    take: number;
  }): Promise<OrdemServicoPainelItem[]>;
  countAtivasParaPainel(): Promise<number>;
  save(os: OrdemServico): Promise<OrdemServico>;
  updateStatus(
    id: string,
    data: UpdateOrdemServicoStatusInput,
  ): Promise<OrdemServicoComClienteVeiculo>;
  createWithItems(
    input: CreateOrdemServicoInput,
  ): Promise<OrdemServicoComClienteVeiculo>;
  finalizar(id: string): Promise<void>;
  aprovarOrcamentoComReserva(id: string): Promise<{
    resultado: OrdemServicoComClienteVeiculo;
    pecasReservadas: { pecaEstoqueId: string; quantidade: number }[];
  }>;
  rejeitarOrcamento(id: string): Promise<OrdemServicoComClienteVeiculo>;
  gerarOrcamento(
    id: string,
    total: number,
  ): Promise<
    OrdemServicoComClienteVeiculo & {
      itensServico: unknown[];
      itensPeca: unknown[];
    }
  >;
  findForGerarOrcamento(id: string): Promise<
    | (OrdemServicoComClienteVeiculo & {
        itensServico: {
          quantidade: number;
          servicoCatalogo: { precoBase: unknown };
        }[];
        itensPeca: {
          quantidade: number;
          pecaEstoque: { precoUnitario: unknown };
        }[];
      })
    | null
  >;
}
