import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OS_MONGO_AUDIT } from '../../../domain/atendimento/ports';
import type {
  HistoricoOsItem,
  OsMongoAuditPort,
} from '../../../domain/atendimento/ports';
import { ORDEM_SERVICO_READ_PORT } from '../../../domain/atendimento/ports/ordem-servico-read.port';
import type { OrdemServicoReadPort } from '../../../domain/atendimento/ports/ordem-servico-read.port';

@Injectable()
export class ListarHistoricoOsUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_READ_PORT)
    private readonly ordensRead: OrdemServicoReadPort,
    @Inject(OS_MONGO_AUDIT) private readonly audit: OsMongoAuditPort,
  ) {}

  async execute(ordemServicoId: string): Promise<HistoricoOsItem[]> {
    const exists = await this.ordensRead.existsById(ordemServicoId);
    if (!exists) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }
    return this.audit.listHistorico(ordemServicoId);
  }
}
