import { Inject, Injectable } from '@nestjs/common';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import { ConsultarStatusOsDto } from '../dto/consultar-status-os.dto';
import { carregarOrdemServicoComValidacaoPublica } from '../helpers/ordem-servico-public-access';

@Injectable()
export class ConsultarStatusOsUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
  ) {}

  async execute(id: string, query: ConsultarStatusOsDto) {
    const os = await carregarOrdemServicoComValidacaoPublica(
      this.ordens,
      id,
      query,
    );

    return {
      id: os.id,
      status: os.status,
      total: os.total,
      dataCriacao: os.dataCriacao,
      dataConclusao: os.dataConclusao,
      dataEntrega: os.dataEntrega,
      cliente: {
        id: os.cliente.id,
        nome: os.cliente.nome,
      },
      veiculo: {
        id: os.veiculo.id,
        placa: os.veiculo.placa,
        modelo: os.veiculo.modelo,
      },
    };
  }
}
