export const ORDEM_SERVICO_READ_PORT = Symbol('ORDEM_SERVICO_READ_PORT');

export interface TempoMedioPorServicoRow {
  servicoId: string;
  descricao: string;
  totalOs: number;
  mediaMinutos: number;
}

export interface TempoMedioExecucaoAggregate {
  totalOs: number;
  globalMinutos: number | null;
  porServico: TempoMedioPorServicoRow[];
}

export interface OrdemServicoReadPort {
  existsById(id: string): Promise<boolean>;
  countAtivasByClienteId(clienteId: string): Promise<number>;
  countAtivasByVeiculoId(veiculoId: string): Promise<number>;
  countAtivasUsandoServico(servicoCatalogoId: string): Promise<number>;
  countReservasAtivasPeca(pecaEstoqueId: string): Promise<number>;
  obterTempoMedioExecucao(): Promise<TempoMedioExecucaoAggregate>;
}
