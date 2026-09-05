import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ServicoCatalogoRepository } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { SERVICO_CATALOGO_REPOSITORY } from '../../../domain/catalogo-servicos/repositories/servico-catalogo.repository';
import { ORDEM_SERVICO_READ_PORT } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';

@Injectable()
export class InativarServicoCatalogoUseCase {
  constructor(
    @Inject(SERVICO_CATALOGO_REPOSITORY)
    private readonly servicos: ServicoCatalogoRepository,
    @Inject(ORDEM_SERVICO_READ_PORT)
    private readonly ordensRead: OrdemServicoReadPort,
  ) {}

  async execute(id: string): Promise<void> {
    const servico = await this.servicos.findById(id);
    if (!servico) {
      throw new NotFoundException('Serviço do catálogo não encontrado');
    }
    if (!servico.ativo) return;

    const itensAtivos = await this.ordensRead.countAtivasUsandoServico(id);
    if (itensAtivos > 0) {
      throw new ConflictException(
        'Serviço está vinculado a ordens de serviço em andamento; conclua-as antes de inativar',
      );
    }

    await this.servicos.softDelete(id);
  }
}
