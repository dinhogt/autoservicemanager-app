export const ORDEM_SERVICO_READ_PORT = Symbol('ORDEM_SERVICO_READ_PORT');

export interface TempoMedioPorServicoRow {
  servicoId: string;
  descricao: string;
  totalOs: number;
  mediaMinutos: number;
}

/** Diagnóstico / Execução / Finalização — permanência média na fase. */
export interface TempoMedioPorFaseRow {
  fase: 'Diagnostico' | 'Execucao' | 'Finalizacao';
  status: string;
  totalTransicoes: number;
  mediaMinutos: number | null;
}

export interface TempoMedioExecucaoAggregate {
  totalOs: number;
  globalMinutos: number | null;
  porServico: TempoMedioPorServicoRow[];
  porFase: TempoMedioPorFaseRow[];
}

export interface OrdemServicoReadPort {
  existsById(id: string): Promise<boolean>;
  countAtivasByClienteId(clienteId: string): Promise<number>;
  countAtivasByVeiculoId(veiculoId: string): Promise<number>;
  countAtivasUsandoServico(servicoCatalogoId: string): Promise<number>;
  countReservasAtivasPeca(pecaEstoqueId: string): Promise<number>;
  obterTempoMedioExecucao(): Promise<TempoMedioExecucaoAggregate>;
}
