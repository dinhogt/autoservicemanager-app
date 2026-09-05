import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StatusOs } from '../../../domain/atendimento/value-objects/status-os.enum';
import { runOrderStatusAssertion } from '../helpers/run-order-status-assertion';
import { OsDomainEventType } from '../../../domain/atendimento/events/os-domain-events';
import {
  OS_MONGO_AUDIT,
  OS_STATUS_NOTIFIER,
} from '../../../domain/atendimento/ports';
import type { OsMongoAuditPort } from '../../../domain/atendimento/ports';
import type { OsStatusNotifierPort } from '../../../domain/atendimento/ports/os-status-notifier.port';
import { ORDEM_SERVICO_REPOSITORY } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import type { OrdemServicoRepository } from '../../../domain/atendimento/repositories/ordem-servico.repository';
import { OrderStatusService } from '../../../domain/atendimento/services';
import { notificarMudancaStatus } from '../helpers/notificar-mudanca-status';

@Injectable()
export class FinalizarOsUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_REPOSITORY)
    private readonly ordens: OrdemServicoRepository,
    private readonly orderStatusService: OrderStatusService,
    @Inject(OS_MONGO_AUDIT) private readonly audit: OsMongoAuditPort,
    @Inject(OS_STATUS_NOTIFIER)
    private readonly statusNotifier: OsStatusNotifierPort,
  ) {}

  async execute(id: string) {
    const os = await this.ordens.findWithClienteVeiculoById(id);

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    runOrderStatusAssertion(() =>
      this.orderStatusService.assertStatusAtual({
        statusAtual: os.status,
        allowedFrom: [StatusOs.EM_EXECUCAO],
        acao: 'finalizar',
      }),
    );

    await this.ordens.finalizar(id);

    await this.audit.recordOsTransition({
      ordemServicoId: id,
      domainEvent: {
        eventType: OsDomainEventType.OsFinalizada,
        payload: {},
      },
      fromStatus: StatusOs.EM_EXECUCAO,
      toStatus: StatusOs.FINALIZADA,
      context: 'FinalizarOs',
    });

    await notificarMudancaStatus({
      audit: this.audit,
      notifier: this.statusNotifier,
      ordemServicoId: id,
      clienteNome: os.cliente.nome,
      clienteContato: os.cliente.contato,
      fromStatus: StatusOs.EM_EXECUCAO,
      toStatus: StatusOs.FINALIZADA,
      context: 'FinalizarOs',
    });

    return {
      id,
      status: StatusOs.FINALIZADA,
      mensagem: 'OS finalizada; peças baixadas',
    };
  }
}
