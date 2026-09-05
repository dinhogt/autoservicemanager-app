import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PecaEstoqueRepository } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { PECA_ESTOQUE_REPOSITORY } from '../../../domain/estoque/repositories/peca-estoque.repository';
import { ORDEM_SERVICO_READ_PORT } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';

@Injectable()
export class InativarPecaUseCase {
  constructor(
    @Inject(PECA_ESTOQUE_REPOSITORY)
    private readonly pecas: PecaEstoqueRepository,
    @Inject(ORDEM_SERVICO_READ_PORT)
    private readonly ordensRead: OrdemServicoReadPort,
  ) {}

  async execute(id: string): Promise<void> {
    const peca = await this.pecas.findById(id);
    if (!peca) {
      throw new NotFoundException('Peça não encontrada');
    }
    if (!peca.ativo) return;

    const reservasAtivas = await this.ordensRead.countReservasAtivasPeca(id);
    if (reservasAtivas > 0) {
      throw new ConflictException(
        'Peça possui reservas ativas em ordens de serviço; libere/baixe antes de inativar',
      );
    }

    await this.pecas.softDelete(id);
  }
}
