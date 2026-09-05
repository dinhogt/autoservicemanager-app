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
export class IniciarDiagnosticoUseCase {
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
        allowedFrom: [StatusOs.RECEBIDA],
        acao: 'iniciar diagnóstico',
      }),
    );

    const updated = await this.ordens.updateStatus(id, {
      status: StatusOs.EM_DIAGNOSTICO,
    });

    await this.audit.recordOsTransition({
      ordemServicoId: id,
      domainEvent: {
        eventType: OsDomainEventType.OsEmDiagnostico,
        payload: { clienteId: os.clienteId, veiculoId: os.veiculoId },
      },
      fromStatus: os.status,
      toStatus: updated.status,
      context: 'IniciarDiagnostico',
    });

    await notificarMudancaStatus({
      audit: this.audit,
      notifier: this.statusNotifier,
      ordemServicoId: id,
      clienteNome: updated.cliente.nome,
      clienteContato: updated.cliente.contato,
      fromStatus: os.status,
      toStatus: updated.status,
      context: 'IniciarDiagnostico',
    });

    return {
      id,
      status: updated.status,
      mensagem: 'OS movida para EM_DIAGNOSTICO',
    };
  }
}
