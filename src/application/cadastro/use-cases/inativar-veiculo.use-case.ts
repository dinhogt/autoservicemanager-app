import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { VeiculoRepository } from '../../../domain/cadastro/repositories/veiculo.repository';
import { VEICULO_REPOSITORY } from '../../../domain/cadastro/repositories/veiculo.repository';
import { ORDEM_SERVICO_READ_PORT } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';

@Injectable()
export class InativarVeiculoUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculos: VeiculoRepository,
    @Inject(ORDEM_SERVICO_READ_PORT)
    private readonly ordensRead: OrdemServicoReadPort,
  ) {}

  async execute(id: string): Promise<void> {
    const veiculo = await this.veiculos.findById(id);
    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }
    if (!veiculo.ativo) return;

    const osAtivas = await this.ordensRead.countAtivasByVeiculoId(id);
    if (osAtivas > 0) {
      throw new ConflictException(
        'Veículo possui ordens de serviço em andamento; conclua-as ou cancele antes de inativar',
      );
    }

    await this.veiculos.softDelete(id);
  }
}
