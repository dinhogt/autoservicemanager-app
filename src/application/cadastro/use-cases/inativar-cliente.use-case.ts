import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ClienteRepository } from '../../../domain/cadastro/repositories/cliente.repository';
import { CLIENTE_REPOSITORY } from '../../../domain/cadastro/repositories/cliente.repository';
import { ORDEM_SERVICO_READ_PORT } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';

@Injectable()
export class InativarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepository,
    @Inject(ORDEM_SERVICO_READ_PORT)
    private readonly ordensRead: OrdemServicoReadPort,
  ) {}

  async execute(id: string): Promise<void> {
    const cliente = await this.clientes.findById(id);
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }
    if (!cliente.ativo) return;

    const osAtivas = await this.ordensRead.countAtivasByClienteId(id);
    if (osAtivas > 0) {
      throw new ConflictException(
        'Cliente possui ordens de serviço em andamento; conclua-as ou cancele antes de inativar',
      );
    }

    await this.clientes.softDelete(id);
  }
}
