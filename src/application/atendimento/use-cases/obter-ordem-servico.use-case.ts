import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';

@Injectable()
export class ObterOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
  ) {}

  async execute(id: string) {
    const os = await this.ordens.findDetailedById(id);
    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }
    return os;
  }
}
