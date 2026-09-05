import { StatusOs } from '../value-objects/status-os.enum';

export interface ClienteResumo {
  id: string;
  nome: string;
  cpfCnpj: string;
  contato: string | null;
}

export interface VeiculoResumo {
  id: string;
  placa: string;
  modelo: string | null;
  clienteId: string;
}

export interface OrdemServicoComClienteVeiculo {
  id: string;
  clienteId: string;
  veiculoId: string;
  status: StatusOs;
  total: { toNumber(): number } | number | null;
  dataCriacao: Date;
  dataConclusao: Date | null;
  dataEntrega: Date | null;
  cliente: ClienteResumo;
  veiculo: VeiculoResumo;
}

export interface OrdemServicoPainelItem {
  id: string;
  status: StatusOs;
  total: number | null;
  dataCriacao: Date;
  cliente: Pick<ClienteResumo, 'id' | 'nome'>;
  veiculo: Pick<VeiculoResumo, 'id' | 'placa' | 'modelo'>;
}
