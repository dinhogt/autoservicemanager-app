import { Inject, Injectable } from '@nestjs/common';
import { ORDEM_SERVICO_READ_PORT } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';

export interface TempoMedioPorServico {
  servicoId: string;
  descricao: string;
  totalOs: number;
  mediaMinutos: number;
}

export interface TempoMedioExecucaoResult {
  totalOs: number;
  globalMinutos: number | null;
  porServico: TempoMedioPorServico[];
  geradoEm: string;
}

@Injectable()
export class ObterTempoMedioExecucaoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_READ_PORT)
    private readonly ordensRead: OrdemServicoReadPort,
  ) {}

  async execute(): Promise<TempoMedioExecucaoResult> {
    const agg = await this.ordensRead.obterTempoMedioExecucao();
    return {
      totalOs: agg.totalOs,
      globalMinutos: agg.globalMinutos,
      porServico: agg.porServico,
      geradoEm: new Date().toISOString(),
    };
  }
}
